// Authored controlled experiment; engine is unmodified. Not an original campaign level.
levelData=[new Stage(function(stage){
for(let x=0;x<17;x++){stage.setObject(x,0,new Wall(0));stage.setObject(x,11,new Wall(0));}
for(let y=1;y<11;y++){stage.setObject(0,y,new Wall(0));stage.setObject(16,y,new Wall(0));}
stage.player.push(new Player(stage,2,4));stage.setObject(3,4,new Flower(false));stage.setObject(4,4,new Key());stage.setObject(5,4,new Door());stage.setObject(6,4,new Treasure());stage.setObject(7,4,new Mushroom(false));
})];
document.title='Research lab01 collect';new Game('lab01',levelData);
