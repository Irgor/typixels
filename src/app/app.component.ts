import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

enum MATCHS_STATES {
  IDLE = 'idle',
  CORRECT = 'correct',
  WRONG = 'wrong',
  ADDITION = 'addition'
}

type Letter = { value: string, match: MATCHS_STATES }
type Move = { text: string, letters: Letter[] }

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  @ViewChild("userType", { read: ElementRef }) userTypeRef!: ElementRef<HTMLInputElement>;
  @ViewChild("game", { read: ElementRef }) game!: ElementRef<HTMLDivElement>;
  @ViewChild("enemy", { read: ElementRef }) enemy!: ElementRef<HTMLDivElement>;
  @ViewChild("player", { read: ElementRef }) player!: ElementRef<HTMLDivElement>;

  title = 'typixels';

  intro = ''
  actionDone = false;

  currentMove: Move = {
    text: 'play',
    letters: []
  };

  playerLeft: number = 0;

  enemyLeft: number = 0;
  enemyVelocity = 5;

  points = 0;

  userTypeValue: string = '';
  disableUserType: boolean = false;

  RIGHT_ANSWER_ANIMATION_TIME = 300;

  stepAudio = new Audio('assets/sounds/step.mp3');
  successAudio = new Audio('assets/sounds/success.mp3');
  errorAudio = new Audio('assets/sounds/wrong.mp3');

  words = ['top', 'left', 'down', 'up', 'dash', 'jump', 'attack', 'double dash', 'double jump', 'corner', 'surprise'];

  gameInterval?: any;

  ngOnInit(): void {
    const intro = localStorage.getItem('intro')
    this.intro = intro ?? ''

    this.fillNextMove('start');
    this.stepAudio.volume = 1;
    this.successAudio.volume = 1;
    this.errorAudio.volume = 1;
    this.stepAudio.load();
    this.successAudio.load();
    this.errorAudio.load();
  }

  start() {
    this.intro = 'skip';
    this.actionDone = true;
    localStorage.setItem('intro', 'skip');
    this.focusUserType();

    this.enemyLeft = Math.floor((window.innerWidth - (this.enemy.nativeElement.clientWidth / 2)));

    this.playerLeft = Math.floor((window.innerWidth / 100) * 25);
    this.player.nativeElement.style.left = this.playerLeft + 'px';
  }

  fillNextMove(text: string) {
    this.currentMove.text = text;
    this.currentMove.letters = this.currentMove.text.split('').map(letter => {
      return { value: letter, match: MATCHS_STATES.IDLE }
    })
  }

  handleUserType(): void {
    const userTypeLetters = this.userTypeValue.split('');

    this.updateCurrentMoveMatches(userTypeLetters);

    const finish = this.userTypeValue == this.currentMove.text;
    if (finish) {
      this.handleUserCorrectAnswer();
    }
  }

  handleUserCorrectAnswer(): void {
    this.disableUserType = true;

    this.userTypeRef.nativeElement.nextElementSibling!.classList.add('right-answer');

    this.successAudio.currentTime = 0;
    this.successAudio.play();

    this.enemyLeft += Math.floor(this.currentMove.text.length * 15);

    this.points++;

    setTimeout(() => {
      this.finishMoveAndPrepareNext();
      this.userTypeRef.nativeElement.nextElementSibling!.classList.remove('right-answer');
    }, this.RIGHT_ANSWER_ANIMATION_TIME)
  }

  updateCurrentMoveMatches(userTypeLetters: string[]) {
    let hasWrong = false;

    for (let [i, letter] of this.currentMove.letters.entries()) {
      if (!userTypeLetters[i]) {
        letter.match = MATCHS_STATES.IDLE;
        continue;
      }

      if (userTypeLetters[i] == letter.value) {
        letter.match = MATCHS_STATES.CORRECT;
      }

      if (userTypeLetters[i] != letter.value) {
        letter.match = MATCHS_STATES.WRONG;
        hasWrong = true;
      }
    }

    if (hasWrong) {
      this.errorAudio.currentTime = 0;
      this.errorAudio.play();
    } else if (this.userTypeValue != this.currentMove.text) {
      this.stepAudio.currentTime = 0;
      this.stepAudio.play();
    }
  }

  finishMoveAndPrepareNext() {
    this.userTypeValue = '';

    this.changeGameStage(this.currentMove.text);
    this.fillNextMove(this.getRandomWord());

    this.disableUserType = false;
    this.focusUserType();

    this.increaseDifficult();
  }

  changeGameStage(pastStage: string): void {
    switch (pastStage) {
      case "start":
        this.game.nativeElement.classList.remove('pause');
        this.game.nativeElement.classList.add('play');
        this.enemy.nativeElement.style.display = 'block'
        this.enemy.nativeElement.style.left = this.enemyLeft + 'px';
        this.startCount();
        this.points = 0;
        break;
    }
  }

  focusUserType(): void {
    setTimeout(() => {
      this.userTypeRef.nativeElement.focus();
    }, 1);
  }

  getRandomWord(): string {
    if (this.points > 10) {
      const useRandomWord = Math.floor(Math.random() * 10) + 1;
      if (useRandomWord > 6) {
        const randomWordLength = Math.floor(Math.random() * 6) + 1;
        return this.generateRandomString(randomWordLength);
      }
    }

    const index = Math.floor(Math.random() * this.words.length);
    return this.words[index];
  }

  generateRandomString(length: number): string {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    let result = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charactersLength);
      result += characters[randomIndex];
    }

    return result;
  }

  startCount(): void {
    this.gameInterval = setInterval(() => {
      if (this.enemyLeft <= (this.playerLeft + (this.player.nativeElement.clientWidth / 2))) {
        clearInterval(this.gameInterval);
        alert('you lost');
      }

      this.enemyLeft -= this.enemyVelocity;
      this.enemy.nativeElement.style.left = this.enemyLeft + 'px';
    }, 60);
  }

  increaseDifficult() {
    this.enemyVelocity += 0.10;
  }

}
