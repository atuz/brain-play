import test from 'node:test';
import assert from 'node:assert/strict';
import {layoutFallback} from './layout-compat.js';

function environment(supported,run){
  const keys=['CSS','ResizeObserver','MutationObserver','getComputedStyle','matchMedia'];
  const previous=keys.map(key=>Object.getOwnPropertyDescriptor(globalThis,key));
  const observers={};
  Object.assign(globalThis,{
    CSS:{supports:()=>supported},
    ResizeObserver:class {
      constructor(callback){observers.sizes=this;this.callback=callback;this.nodes=new Set();}
      observe(node){this.nodes.add(node);}unobserve(node){this.nodes.delete(node);}
      disconnect(){this.nodes.clear();observers.sizesDisposed=true;}
    },
    MutationObserver:class {
      constructor(callback){observers.children=this;this.callback=callback;this.nodes=[];}
      observe(node,options){this.nodes.push([node,options]);}
      disconnect(){observers.childrenDisposed=true;}
    },
    getComputedStyle:node=>({getPropertyValue:key=>node.variables?.[key]||''}),
    matchMedia:()=>({matches:false}),
  });
  try{run(observers);}finally{keys.forEach((key,i)=>{if(previous[i])Object.defineProperty(globalThis,key,previous[i]);else delete globalThis[key];});}
}
function node(selector,width,variables){return{style:{},variables,matches:value=>selector===value,getBoundingClientRect:()=>({width})};}
test('native aspect ratio adds no observers or inline styles',()=>{
  environment(true,observers=>{const dispose=layoutFallback({});dispose();assert.deepEqual(observers,{});});
});
test('legacy aspect ratios size boards and newly replaced cells, then release every observer',()=>{
  environment(false,observers=>{
    const home=node('.home-game-art',115),classic=node('.classic-board',100,{'--columns':'10','--rows':'5'}),machine=node('.mw-stage',80),cell=node('.cell',40);
    let items=[home,classic,machine,cell];const grid={};
    const root={contains:item=>items.includes(item),querySelectorAll:selector=>selector==='.board,.nonogram,.goal-grid'?[grid]:items};
    const dispose=layoutFallback(root);
    assert.deepEqual(items.map(n=>n.style.height),['100px','50px','100px','40px']);
    assert.deepEqual(observers.children.nodes,[[grid,{childList:true}]]);
    const next=node('.cell',50);items=[home,classic,machine,next];observers.children.callback();
    assert.equal(observers.sizes.nodes.has(cell),false);assert.equal(next.style.height,'50px');
    dispose();assert.equal(observers.sizesDisposed,true);assert.equal(observers.childrenDisposed,true);
  });
});
