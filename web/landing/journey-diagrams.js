// Geometric, illustrative models of the public chapter fields, not price data.
export function drawJourneyDiagram(ctx, index) {
  ctx.clearRect(0, 0, 720, 740);
  const gold = '#efc67e', paper = '#d5e1ef', muted = '#92a9c1', line = '#39516a';
  const text = (label, x, y, color = paper, size = 26) => { ctx.fillStyle = color; ctx.font = `500 ${size}px Archivo, sans-serif`; ctx.fillText(label, x, y); };
  const path = (points, color = gold) => { ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath(); points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.stroke(); };
  const node = (x, y, label, detail, active = false, width = 560) => {
    ctx.fillStyle = active ? '#253241' : '#0c1c2c'; ctx.fillRect(x, y, width, 108);
    ctx.strokeStyle = active ? gold : line; ctx.lineWidth = 2; ctx.strokeRect(x, y, width, 108);
    text(label, x + 24, y + 43, active ? gold : paper, 29);
    text(detail, x + 24, y + 80, muted, 22);
  };
  text(['THE CONNECTED PROCESS', 'CONTEXT ACROSS TIMEFRAMES', 'FIVE SESSIONS / ONE MODEL', 'FROM LOCATION TO A PLAN', 'READ THE SESSION', 'CHECK EVERY LINK', 'THE REVIEW RETURNS'][index], 42, 62, gold, 24);
  if (index === 0) {
    ['Monthly', 'Weekly', 'Daily', 'Session'].forEach((label, i) => {
      node(42 + i * 26, 120 + i * 132, label, ['Context', 'Model', 'Plan', 'Confirmation'][i], i === 3, 530 - i * 26);
      if (i < 3) path([[295,228+i*132],[295,252+i*132]], line);
    });
  } else if (index === 1) {
    [[42, 140, 584, 390], [95, 216, 478, 314], [148, 292, 372, 238]].forEach(([x,y,w,h], i) => {
      ctx.fillStyle = ['#101f30','#142a3c','#1b3448'][i]; ctx.fillRect(x,y,w,h); ctx.strokeStyle = i === 2 ? gold : line; ctx.strokeRect(x,y,w,h);
      text(['Quarterly context', 'Monthly profile', 'STS / LTS bias'][i], x+24,y+45,i===2?gold:paper,26);
    });
    text('Larger context first.',42,600,paper,30); text('Then a smaller-timeframe expectation.',42,645,muted,23);
  } else if (index === 2) {
    text('MMBM / MMSM',42,156,paper,42);
    path([[42,270],[622,270]],gold);
    for(let i=0;i<5;i++) { const x=42+i*118;ctx.fillStyle=i===2?gold:'#20384e';ctx.fillRect(x,236,98,68);text(String(i+1).padStart(2,'0'),x+26,280,i===2?'#081320':paper,28); }
    node(42,360,'Expected delivery','Write the model before the session.',false,580);
    node(42,500,'Observed behaviour','Compare the session with the plan.',true,580);
  } else if (index === 3) {
    node(42,130,'Higher-timeframe context','Bias + points of interest',false,580);
    path([[330,239],[330,304]],gold);
    ctx.fillStyle='#3b3427';ctx.fillRect(42,300,580,110);text('PLANNED LOCATION',68,344,gold,27);text('Observe price at the location.',68,385,paper,23);
    path([[330,410],[330,475]],gold);
    node(42,478,'Session plan','Location alone is not confirmation.',true,580);
  } else if (index === 4) {
    node(42,142,'London','Session profile',false,277);node(344,142,'New York','Session profile',false,277);
    path([[180,250],[180,303],[480,303],[480,250]],line);path([[330,303],[330,350]],gold);
    ['Location','Observed profile','Confirmation'].forEach((label,i)=> {const y=370+i*86;ctx.fillStyle=i===2?gold:muted;ctx.beginPath();ctx.arc(62,y,8,0,Math.PI*2);ctx.fill();text(label,92,y+10,i===2?gold:paper,30);if(i<2)path([[62,y+10],[62,y+75]],line);});
  } else if (index === 5) {
    ['Context', 'Location', 'Confirmation'].forEach((label,i)=> {const y=132+i*140;node(42,y,label,['Check the larger picture','Return to the written plan','Require the planned model'][i],i===2,580);if(i<2)path([[330,y+108],[330,y+140]],line);});
    text('A missing link → WAIT',42,642,gold,32);
  } else {
    node(42,132,'Plan','Context + expectation',false,580);
    node(42,302,'Decision','Action + emotion',false,580);
    node(42,472,'Review','Lesson for the next session',true,580);
    path([[650,526],[676,526],[676,186],[650,186]],gold);
    path([[662,174],[650,186],[662,198]],gold);
    path([[330,240],[330,302]],line);path([[330,410],[330,472]],line);
    text('The lesson reconnects.',42,650,gold,30);
  }
}
