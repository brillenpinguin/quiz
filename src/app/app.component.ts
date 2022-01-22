/*
* Wheel mechanics inspired by https://codepen.io/barney-parker/pen/OPyYqy
*/
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild } from '@angular/core';
import * as z from 'zod';

// roulette wheel options
const radius = 450;
const spinningSpeed = Math.PI / 20;
const showAnswerDialog = 'Antwort anzeigen';
const selectorColor = '#db2d16';

type Option = { question: string, answer: string };

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'quiz';
  public optionList: Option[] = [];
  public context: CanvasRenderingContext2D | null = null;
  public selectedOption: Option | null = null;
  public showQuestion = true;
  public displayAnswer = showAnswerDialog;

  private sectorAngle = 0;
  private startAngle = 0;
  private wheelOffset = 0;

  private spinningTime = 0;
  private spinningTimeout: NodeJS.Timeout | null = null;
  private wheelSpeed = 1;

  @ViewChild('roulette', { static: false })
  rouletteCanvas!: ElementRef<HTMLCanvasElement>

  constructor(private http: HttpClient) { }


  ngOnInit(): void {
    this.getOptions().subscribe(data => {
      console.log(`Got option list: ${JSON.stringify(data)}`)
      this.optionList = z.array(z.object({ question: z.string(), answer: z.string() }).strict()).parse(data);
      this.drawRouletteWheel();
    });
  }

  ngAfterViewInit(): void {
    this.context = this.rouletteCanvas.nativeElement.getContext('2d')
    this.drawRouletteWheel();
  }

  ngOnChanges(): void {
    this.drawRouletteWheel();
  }

  private getOptions() {
    return this.http.get('assets/options.json');
  }

  private midX() {
    return this.rouletteCanvas.nativeElement.width / 2;
  }

  private midY() {
    return this.rouletteCanvas.nativeElement.height / 2;
  }

  private drawSegmentLine(angle: number) {
    this.context!.beginPath();
    this.context!.moveTo(this.midX(), this.midY());
    this.context!.lineTo(this.midX() + radius * Math.cos(angle), this.midY() + radius * Math.sin(angle));
    this.context!.stroke();
  }

  private reset() {
    this.showQuestion = false;
    this.displayAnswer = showAnswerDialog;
    this.spinningTime = 0;
    this.wheelSpeed = 1;
  }

  public showAnswer() {
    this.displayAnswer = this.selectedOption?.answer ?? showAnswerDialog;
  }

  public spinWheel() {
    this.reset();
    const spinningEndTime = Math.random() * this.optionList.length + 4 * 1000;
    this.rotateWheel(spinningEndTime);
  }

  private rotateWheel(endTime: number) {
    this.wheelSpeed = 1 - (this.spinningTime) / endTime;
    this.spinningTime += 30;
    if (this.spinningTime > endTime) {
      return this.stopWheel();
    }
    const advanceWheelAngle = this.wheelSpeed * spinningSpeed;
    this.wheelOffset += advanceWheelAngle;
    this.drawRouletteWheel();
    this.spinningTimeout = setTimeout(() => this.rotateWheel(endTime), 30);
  }

  private stopWheel() {
    this.showQuestion = true;
    if (this.spinningTimeout) {
      clearTimeout(this.spinningTimeout)
    }
    this.spinningTime = 0;
    this.wheelSpeed = 1;
  }

  private drawRouletteWheel() {
    // style
    this.context!.font = '24px Roboto';

    // outer circle
    this.sectorAngle = (2 * Math.PI) / this.optionList.length;
    this.startAngle = - this.sectorAngle / 2;
    const midX = this.rouletteCanvas.nativeElement.width / 2;
    const midY = this.rouletteCanvas.nativeElement.height / 2;
    this.context!.clearRect(0, 0, this.rouletteCanvas.nativeElement.width, this.rouletteCanvas.nativeElement.height);
    this.context!.strokeStyle = 'black'
    this.context!.lineWidth = 2;
    this.context!.beginPath();
    this.context!.arc(midX, midY, radius, this.startAngle, this.startAngle + 2 * Math.PI);
    this.context!.stroke();
    this.optionList.forEach((option, i) => {
      // line segments
      const angle = this.startAngle + i * this.sectorAngle;
      this.drawSegmentLine(angle + this.wheelOffset);
      this.context!.save();
      // segment text
      this.context!.translate(midX + (radius / 2) * Math.cos(angle + this.wheelOffset + this.sectorAngle / 2), midY + (radius / 2) * Math.sin(angle + this.wheelOffset + this.sectorAngle / 2));
      this.context!.rotate(angle + this.wheelOffset + this.sectorAngle / 2);
      this.context!.fillText(option.question, -this.context!.measureText(option.question).width / 2, 10);
      this.context!.restore();
    });
    // target marker
    this.context!.save();
    this.context!.strokeStyle = selectorColor;
    this.context!.lineWidth = 4;
    this.context!.beginPath();
    this.context!.arc(midX, midY, radius, - this.sectorAngle / 2, - this.sectorAngle / 2 + this.sectorAngle);
    this.context!.stroke();
    this.drawSegmentLine(- this.sectorAngle / 2);
    this.drawSegmentLine(- this.sectorAngle / 2 + this.sectorAngle);
    this.context!.restore();

    // selected option
    this.selectedOption = this.optionList[Math.floor(mod2Pi(-this.wheelOffset + this.sectorAngle / 2) / this.sectorAngle)]
    console.log(`Selected option: ${JSON.stringify(this.selectedOption)}`);
  }
}

function mod2Pi(angle: number) {
  let result = angle;
  while (result < 0) {
    console.log('debug: while')
    result += 2 * Math.PI;
  }
  return result;
}