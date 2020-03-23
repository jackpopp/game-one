const imageUris = {
    enemies: [
        './img/meteor1.png',
        './img/meteor2.png',
        './img/meteor3.png',
        './img/meteor4.png',
        './img/meteor5.png',
        './img/meteor6.png',
        './img/meteor7.png'
    ],
    player: './img/player.png'
}

class Game {
    constructor( imageUris ) {
        this.imageUris = imageUris;
        this.round = 1;
        this.meteorCount = 0;
        this.blobsToMake = 10;
        this.roundLength = 30;
    }

    loadImages() {
        this.images = {
            enemies: []
        };

        const imagePromises = this.imageUris.enemies.map( image => {
            return new Promise( ( resolve ) => {
                const img = new Image;
                img.addEventListener( 'load', () => {
                    resolve( img );
                });
                img.src = image;
                this.images.enemies.push(img);
            } )
            
        } );

        const playerImagePromise = new Promise( ( resolve ) => {
            const playerImage = new Image;
            playerImage.addEventListener( 'load', () => {
                resolve( playerImage
                     );
            });
            playerImage.src = this.imageUris.player;
            this.images.player = playerImage;
        });

        imagePromises.push(playerImagePromise);
        return imagePromises; 
    }

    init() {
        this.canvas = document.getElementById('game');
        this.context = this.canvas.getContext('2d');
        this.blobSize = 25;
        this.blobs = [];
    
        this.resetScores();
        this.startGame();
    }
    
    resetScores() {
        document.querySelector('.round').innerHTML = this.round;
        document.querySelector('.count').innerHTML = this.meteorCount;
    }

    startGame() {
        this.startTime = new Date().getTime()/1000;
        this.createBlobs();
        this.player = new Player( 0, 0, this.blobSize * 1.2, this.blobSize * 1.2, this.images.player );
        this.setUpEventListeners();
        this.loop();
    }

    setUpEventListeners( ) {
        window.addEventListener( 'keydown', event => {
            
            const map = {
                37: 'left',
                38: 'up',
                39: 'right',
                40: 'down'   
            }

            const direction = map[event.keyCode];
            this.player.changeDirection( direction );
            
        } );
    }

    createBlobs() {
        for ( let i = 0; i < this.blobsToMake; i++ ) {
            const index = Math.floor(Math.random() * (6 - 0) + 0);
            const image = this.images.enemies[ index ];
            this.blobs.push(
                new Blob( this.canvas.width/2 - this.blobSize, this.canvas.height/2 - this.blobSize, this.blobSize, this.blobSize, image )
            );
        }
    }

    loop() {
        /*if ( this.blobs.length === 0 && this.blobSize === 10 ) {
            return;
        }*/

        if ( this.blobs.length === 0) {
            this.blobsToMake += 1;
            this.roundLength += 1;
            this.blobSize -= 1;
            this.createBlobs();
            this.round += 1;
            this.renderRound( this.round );
            this.startTime = new Date().getTime() / 1000;
        }

        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBlobs( this.blobs );
        this.drawBlobs( [ this.player ] );

        const blobsToRemove = [];

        this.blobs.forEach( ( blob, index ) => {
            const collide = this.blobCollide( blob, this.player );
            if ( collide ) {
                blobsToRemove.push( index );
                this.meteorCount += 1;
            }
        } );

        blobsToRemove.forEach( index => {
            this.blobs.splice( index, 1 );
        } );

        //document.querySelector( '.count' ).innerHTML = this.meteorCount;

        this.context.font = "18px Consolas,Monaco,'Andale Mono','Ubuntu Mono',monospace";
        this.context.fillStyle = 'white';
        this.context.fillText(`Meteors Destroyed: ${this.meteorCount}`, 15, 30);

        this.currentTime = (new Date().getTime()/1000 - this.startTime);
        const timeLeft = (this.roundLength - this.currentTime).toFixed(0);
        document.querySelector( '.timer' ).innerHTML = Math.abs(timeLeft);

        if ( timeLeft <= 0) {
            document.querySelector('.start-game').classList.remove('hidden');
            return;
        }

        this.id = window.requestAnimationFrame( () => {
            this.loop();
        } );
    }

    renderRound( round ) {
        document.querySelector( '.round' ).innerHTML = round;
    }

    drawBlobs( blobs ) {
        

        blobs.forEach(blob => {

            this.context.drawImage(
                blob.image,
                blob.x, 
                blob.y, 
                blob.width, 
                blob.height
            );
    
            blob.computeCords();
    
            const collideX = this.collideX( this.canvas.width, blob );
            const collideY = this.collideY( this.canvas.height, blob );
    
            blob.computeDirectionX( collideX );
            blob.computeDirectionY( collideY );
        });
    }

    collideX( width, blob ) {
        if ( blob.x >= width - blob.width ) {
            return 'right';
        }

        if ( blob.x <= 0 ) {
            return 'left'
        }
    }

    collideY( height, blob ) {
        if ( blob.y >= height - blob.height ) {
            return 'bottom';
        }

        if ( blob.y <= 0 ) {
            return 'top'
        }
    }

    blobCollide( blobOne, blobTwo ) {
        const xCollide = blobOne.x > blobTwo.x && blobOne.x < blobTwo.x + blobTwo.width || blobTwo.x > blobOne.x && blobTwo.x < blobOne.x + blobOne.width;
        const yCollide = blobOne.y > blobTwo.y  && blobOne.y < blobTwo.y + blobTwo.height ||  blobTwo.y > blobOne.y && blobTwo.y < blobOne.y + blobOne.height;
        return xCollide && yCollide;
    }
}
    

class Blob {
    constructor( x, y, width, height, image ) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.dirX = this.createRandomValue(-7, 7);
        this.dirY = this.createRandomValue(-7, 7);
        this.colour = '#0055ab';
        this.image = image;
    }
    
    computeCords() {
        this.x += this.dirX;
        this.y += this.dirY;
    }

    computeDirectionX( collideX ) {
        if ( collideX === 'left' ) {
            this.dirX = this.createRandomValue(2, 7);
        }

        if ( collideX === 'right' ) {
            this.dirX = this.createRandomValue(-2, -7);
        }
    }

    computeDirectionY( collideY ) {
        if ( collideY === 'top' ) {
            this.dirY = this.createRandomValue(2, 7);
        }

        if ( collideY === 'bottom' ) {
            this.dirY = this.createRandomValue(-2, -7);
        }
    }

    createRandomValue(min, max) {
        return Math.random() * (max - min) + min
    }
}

class Player extends Blob {
    constructor( ...args ) {
        super( ...args );
        
        this.colour = '#0ff000';
    }

    changeDirection( direction ) {

        if ( direction === 'left' ) {
            this.dirX = this.createRandomValue(-2, -7);
        }

        if ( direction === 'right' ) {
            this.dirX = this.createRandomValue(2, 7);
        }

        if ( direction === 'up' ) {
            this.dirY = this.createRandomValue(-2, -7);
        }

        if ( direction === 'down' ) {
            this.dirY = this.createRandomValue(2, 7);
        }

    }
}

const utils = {
    createRandomValue(min, max) {
        return Math.random() * (max - min) + min;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('.start-game');
    button.addEventListener('click', () => {
        button.classList.add("hidden");
        
        const game = new Game( imageUris );

        Promise.all(game.loadImages()).then(() => {
            game.init()
        });
    });
});