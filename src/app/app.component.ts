/*
* Wheel mechanics inspired by https://codepen.io/barney-parker/pen/OPyYqy
*/
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { environment } from 'src/environments/environment';
import * as z from 'zod';

// roulette wheel options
const spinningSpeed = Math.PI / 20;
const selectorColor = '#db2d16';

type Option = { question: string, answer: [string, string][] };

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
  public showAnswer = false;

  private canvasSideLength = () => Math.max(window.innerHeight - 200, 600);
  private radius = () => this.canvasSideLength() / 2 - 10;
  private sectorAngle = 0;
  private startAngle = 0;
  private wheelOffset = 0;

  private spinningTime = 0;
  private spinningTimeout: NodeJS.Timeout | null = null;
  private wheelSpeed = 1;

  @ViewChild('roulette', { static: false })
  rouletteCanvas!: ElementRef<HTMLCanvasElement>

  constructor() {
    this.optionList = z.array(z.object({ question: z.string(), answer: z.record(z.string()) }).strict()).parse(environment.options).map(option => ({
      ...option, answer: Object.entries(option.answer),
    }));
    this.selectedOption = this.optionList[0];
  }

  ngAfterViewInit(): void {
    this.context = this.rouletteCanvas.nativeElement.getContext('2d')
    this.drawRouletteWheel();
  }

  ngOnChanges(): void {
    this.drawRouletteWheel();
  }

  @HostListener('window:resize')
  onResize() {
    this.drawRouletteWheel();
  }

  private midX() {
    return this.canvasSideLength() / 2;
  }

  private midY() {
    return this.canvasSideLength() / 2;
  }

  private drawSegmentLine(angle: number) {
    this.context!.beginPath();
    this.context!.moveTo(this.midX(), this.midY());
    this.context!.lineTo(this.midX() + this.radius() * Math.cos(angle), this.midY() + this.radius() * Math.sin(angle));
    this.context!.stroke();
  }

  public doShowAnswer() {
    this.showAnswer = true;
    console.log(`show answer is now ${this.showAnswer}`);
  }

  private reset() {
    this.showQuestion = false;
    this.showAnswer = false;
    this.spinningTime = 0;
    this.wheelSpeed = 1;
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

    // selected option
    this.selectedOption = this.optionList[Math.floor(mod2Pi(-this.wheelOffset + this.sectorAngle / 2) / this.sectorAngle)]
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
    this.context!.canvas.width = this.canvasSideLength();
    this.context!.canvas.height = this.canvasSideLength();
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
    this.context!.arc(midX, midY, this.radius(), this.startAngle, this.startAngle + 2 * Math.PI);
    this.context!.stroke();
    this.optionList.forEach((option, i) => {
      // line segments
      const angle = this.startAngle + i * this.sectorAngle;
      this.drawSegmentLine(angle + this.wheelOffset);
      this.context!.save();
      // segment text
      const segmentText = `${option.question}?`;
      this.context!.translate(midX + (this.radius() / 2) * Math.cos(angle + this.wheelOffset + this.sectorAngle / 2), midY + (this.radius() / 2) * Math.sin(angle + this.wheelOffset + this.sectorAngle / 2));
      this.context!.rotate(angle + this.wheelOffset + this.sectorAngle / 2);
      this.context!.fillText(segmentText, -this.context!.measureText(segmentText).width / 2, 10);
      this.context!.restore();
    });
    // target marker
    this.context!.save();
    this.context!.strokeStyle = selectorColor;
    this.context!.lineWidth = 4;
    this.context!.beginPath();
    this.context!.arc(midX, midY, this.radius(), - this.sectorAngle / 2, - this.sectorAngle / 2 + this.sectorAngle);
    this.context!.stroke();
    this.drawSegmentLine(- this.sectorAngle / 2);
    this.drawSegmentLine(- this.sectorAngle / 2 + this.sectorAngle);
    this.context!.restore();
  }
}

function mod2Pi(angle: number) {
  let result = angle;
  while (result < 0) {
    result += 2 * Math.PI;
  }
  return result;
}