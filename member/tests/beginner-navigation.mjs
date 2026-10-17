import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../main.jsx', import.meta.url), 'utf8');
const goSource = source.slice(source.indexOf('  const go = (id) => {'), source.indexOf('\n  useEffect', source.indexOf('  const go = (id) => {')));
let current = new URL('https://lmrcapitals.com/inner-circle?preview=1&next=journal#billing');
let route='billing';
const context = { URLSearchParams, location: { get search(){return current.search}, get pathname(){return current.pathname}, get hash(){return current.hash}, set hash(v){current.hash=v} }, history:{replaceState:(_,__,url)=>{current=new URL(url,current)}},accessState:{paid:false},canOpenJournal:()=>false,preview:true,route,setRoute:v=>route=v,setMenu:()=>{},setSearch:()=>{} };
vm.createContext(context);vm.runInContext(goSource+';this.go=go;',context);
for(const destination of ['dashboard','resources','terminology','questions']) {
 context.go('application'); assert.equal(current.searchParams.get('next'),'journal'); assert.equal(current.hash,'#billing');
 context.go(destination); assert.equal(current.searchParams.has('next'),false);assert.equal(current.hash,'#'+destination);assert.equal(current.searchParams.get('preview'),'1');
}
console.log('PASS: locked Journal then Dashboard/resources/learning/questions clears pending intent and preserves other parameters.');
