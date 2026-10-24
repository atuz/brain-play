// Authored controlled experiment; engine is unmodified. Not an original campaign level.
levelData=[new Stage(function(stage){
for(let x=0;x<17;x++){stage.setObject(x,0,new Wall(0));stage.setObject(x,11,new Wall(0));}
for(let y=1;y<11;y++){stage.setObject(0,y,new Wall(0));stage.setObject(16,y,new Wall(0));}
stage.player.push(new Player(stage,2,4));stage.setObject(3,4,new Pill());stage.setObject(9,4,new LaserGun());stage.setObject(6,3,new PFlower(true));
})];
document.title='Research lab09 pill';new Game('lab09',levelData);
