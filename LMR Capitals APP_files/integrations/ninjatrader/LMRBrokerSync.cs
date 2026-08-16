// LMR Capitals — NinjaTrader 8 broker-fill relay AddOn
// -----------------------------------------------------------------------------
// Hooks every account's ExecutionUpdate and POSTs each fill to the LMR Capitals
// broker-webhook Edge Function as a UniversalFillEvent. The webhook drops it into
// the trades table as an UNCONFIRMED draft; you complete the ICT fields in the app.
//
// INSTALL
//   1. In NinjaTrader 8: Tools → Import → NinjaScript Add-On…  and pick this file,
//      OR copy it to:
//        Documents\NinjaTrader 8\bin\Custom\AddOns\LMRBrokerSync.cs
//   2. New → NinjaScript Editor → Compile (F5).
//   3. Create the config file (see LMRBrokerSync.config.example) at:
//        Documents\NinjaTrader 8\LMRBrokerSync.config
//   4. Restart NinjaTrader. Fills now flow to your app automatically.
//
// The config is a plain key=value file so nothing (userId / secret) is hardcoded
// and each user's install uses their own values. A network failure never crashes
// NinjaTrader — it is caught, logged to the NinjaScript Log tab, and trading
// continues.
// -----------------------------------------------------------------------------

using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Net.Http;
using System.Text;
using NinjaTrader.Cbi;
using NinjaTrader.NinjaScript;

namespace NinjaTrader.NinjaScript.AddOns
{
    public class LMRBrokerSync : AddOnBase
    {
        private static readonly HttpClient Http = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };

        private string _userId = "";
        private string _webhookSecret = "";
        private string _webhookUrl = "";
        private bool _configured = false;

        private readonly HashSet<Account> _hooked = new HashSet<Account>();

        protected override void OnStateChange()
        {
            if (State == State.SetDefaults)
            {
                Name = "LMR Broker Sync";
                Description = "Relays NinjaTrader fills to the LMR Capitals journal webhook.";
            }
            else if (State == State.Configure)
            {
                LoadConfig();
                if (!_configured) return;

                // Hook accounts that already exist, and any added later.
                lock (Account.All)
                {
                    foreach (Account a in Account.All) Hook(a);
                    Account.All.CollectionChanged += OnAccountsChanged;
                }
            }
            else if (State == State.Terminated)
            {
                try { Account.All.CollectionChanged -= OnAccountsChanged; } catch { }
                foreach (Account a in _hooked)
                {
                    try { a.ExecutionUpdate -= OnExecutionUpdate; } catch { }
                }
                _hooked.Clear();
            }
        }

        private void OnAccountsChanged(object sender, System.Collections.Specialized.NotifyCollectionChangedEventArgs e)
        {
            if (e.NewItems == null) return;
            foreach (object o in e.NewItems)
            {
                Account a = o as Account;
                if (a != null) Hook(a);
            }
        }

        private void Hook(Account a)
        {
            if (a == null || _hooked.Contains(a)) return;
            a.ExecutionUpdate += OnExecutionUpdate;
            _hooked.Add(a);
        }

        private void OnExecutionUpdate(object sender, ExecutionEventArgs e)
        {
            // Wrap EVERYTHING — an exception here must never bubble into NinjaTrader.
            try
            {
                Execution ex = e != null ? e.Execution : null;
                if (ex == null || ex.Order == null) return;

                // Ignore non-fill noise.
                if (ex.Quantity <= 0) return;

                string side = SideFromOrderAction(ex.Order.OrderAction);
                if (side == null) return;

                string symbol   = ex.Instrument != null && ex.Instrument.MasterInstrument != null
                                    ? ex.Instrument.MasterInstrument.Name
                                    : (ex.Instrument != null ? ex.Instrument.FullName : "");
                string account  = ex.Account != null ? ex.Account.Name : "";
                string fillId    = !string.IsNullOrEmpty(ex.ExecutionId) ? ex.ExecutionId : Guid.NewGuid().ToString();
                string orderId   = ex.Order.OrderId ?? "";
                double price     = ex.Price;
                int qty          = ex.Quantity;
                string tsIso     = ex.Time.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ", CultureInfo.InvariantCulture);

                string body = BuildJson(_userId, account, symbol, side, qty, price, tsIso, orderId, fillId);
                Post(body);
            }
            catch (Exception exn)
            {
                Log("LMR Broker Sync — execution handler error: " + exn.Message, LogLevel.Warning);
            }
        }

        private async void Post(string jsonBody)
        {
            try
            {
                using (var content = new StringContent(jsonBody, Encoding.UTF8, "application/json"))
                {
                    var req = new HttpRequestMessage(HttpMethod.Post, _webhookUrl) { Content = content };
                    req.Headers.Add("x-webhook-secret", _webhookSecret);
                    HttpResponseMessage res = await Http.SendAsync(req).ConfigureAwait(false);
                    if (!res.IsSuccessStatusCode)
                        Log("LMR Broker Sync — webhook returned HTTP " + (int)res.StatusCode, LogLevel.Warning);
                }
            }
            catch (Exception ex)
            {
                // Network hiccup: log and move on. Do not retry aggressively — a missed
                // fill can be added manually; keeping NinjaTrader responsive matters more.
                Log("LMR Broker Sync — POST failed: " + ex.Message, LogLevel.Warning);
            }
        }

        private static string SideFromOrderAction(OrderAction a)
        {
            switch (a)
            {
                case OrderAction.Buy:
                case OrderAction.BuyToCover:
                    return "buy";
                case OrderAction.Sell:
                case OrderAction.SellShort:
                    return "sell";
                default:
                    return null;
            }
        }

        // Minimal hand-rolled JSON so the AddOn needs no extra references.
        private static string BuildJson(string userId, string accountId, string symbol, string side,
                                        int qty, double fillPrice, string timestamp, string orderId, string fillId)
        {
            var sb = new StringBuilder();
            sb.Append('{');
            sb.Append("\"broker\":\"ninjatrader\",");
            sb.Append("\"userId\":\"").Append(Esc(userId)).Append("\",");
            sb.Append("\"accountId\":\"").Append(Esc(accountId)).Append("\",");
            sb.Append("\"symbol\":\"").Append(Esc(symbol)).Append("\",");
            sb.Append("\"side\":\"").Append(side).Append("\",");
            sb.Append("\"qty\":").Append(qty.ToString(CultureInfo.InvariantCulture)).Append(',');
            sb.Append("\"fillPrice\":").Append(fillPrice.ToString(CultureInfo.InvariantCulture)).Append(',');
            sb.Append("\"timestamp\":\"").Append(Esc(timestamp)).Append("\",");
            sb.Append("\"orderId\":\"").Append(Esc(orderId)).Append("\",");
            sb.Append("\"fillId\":\"").Append(Esc(fillId)).Append('"');
            sb.Append('}');
            return sb.ToString();
        }

        private static string Esc(string s)
        {
            if (string.IsNullOrEmpty(s)) return "";
            return s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", " ").Replace("\r", " ");
        }

        private void LoadConfig()
        {
            try
            {
                string path = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                    "NinjaTrader 8", "LMRBrokerSync.config");

                if (!File.Exists(path))
                {
                    Log("LMR Broker Sync — config not found at " + path + " (AddOn idle).", LogLevel.Warning);
                    return;
                }

                foreach (string raw in File.ReadAllLines(path))
                {
                    string line = raw.Trim();
                    if (line.Length == 0 || line.StartsWith("#")) continue;
                    int eq = line.IndexOf('=');
                    if (eq <= 0) continue;
                    string key = line.Substring(0, eq).Trim().ToLowerInvariant();
                    string val = line.Substring(eq + 1).Trim();
                    if (key == "userid") _userId = val;
                    else if (key == "webhooksecret") _webhookSecret = val;
                    else if (key == "webhookurl") _webhookUrl = val;
                }

                _configured = !string.IsNullOrEmpty(_userId)
                           && !string.IsNullOrEmpty(_webhookSecret)
                           && !string.IsNullOrEmpty(_webhookUrl);

                Log(_configured
                    ? "LMR Broker Sync — active. Fills will relay to your journal."
                    : "LMR Broker Sync — config incomplete (need userId, webhookSecret, webhookUrl).",
                    _configured ? LogLevel.Information : LogLevel.Warning);
            }
            catch (Exception ex)
            {
                Log("LMR Broker Sync — config read error: " + ex.Message, LogLevel.Error);
            }
        }
    }
}
