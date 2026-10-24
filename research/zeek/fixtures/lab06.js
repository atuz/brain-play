// Authored controlled experiment; engine is unmodified. Not an original campaign level.
levelData=[new Stage(function(stage){
for(let x=0;x<17;x++){stage.setObject(x,0,new Wall(0));stage.setObject(x,11,new Wall(0));}
for(let y=1;y<11;y++){stage.setObject(0,y,new Wall(0));stage.setObject(16,y,new Wall(0));}
stage.player.push(new Player(stage,3,4));stage.setObject(4,4,new Crystal());stage.setObject(6,4,new Crystal());stage.setObject(6,5,new Crystal());
})];
document.title='Research lab06 crystal';new Game('lab06',levelData);
