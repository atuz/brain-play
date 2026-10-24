// Authored controlled experiment; engine is unmodified. Not an original campaign level.
levelData=[new Stage(function(stage){
for(let x=0;x<17;x++){stage.setObject(x,0,new Wall(0));stage.setObject(x,11,new Wall(0));}
for(let y=1;y<11;y++){stage.setObject(0,y,new Wall(0));stage.setObject(16,y,new Wall(0));}
stage.player.push(new Player(stage,2,7));for(let x=2;x<14;x++){stage.setObject(x,3,new Wall(0));stage.setObject(x,5,new Wall(0));}stage.setObject(1,4,new Wall(0));stage.setObject(14,4,new Wall(0));stage.demon.push(new Demon(stage,3,4,DIR_EAST));stage.setObject(6,4,new Apple());stage.setObject(8,4,new Flower(false));stage.setObject(11,4,new Ball());
})];
document.title='Research lab11 grazer';new Game('lab11',levelData);
