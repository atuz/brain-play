// Authored controlled experiment; engine is unmodified. Not an original campaign level.
levelData=[new Stage(function(stage){
for(let x=0;x<17;x++){stage.setObject(x,0,new Wall(0));stage.setObject(x,11,new Wall(0));}
for(let y=1;y<11;y++){stage.setObject(0,y,new Wall(0));stage.setObject(16,y,new Wall(0));}
stage.player.push(new Player(stage,2,4));stage.player.push(new Player(stage,2,7,true));stage.setObject(4,4,new Flower(false));stage.setObject(4,7,new Treasure());
})];
document.title='Research lab12 partner';new Game('lab12',levelData);
