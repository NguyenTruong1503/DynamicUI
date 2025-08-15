import {Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [
    NgIf
  ],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss'
})
export class ToastComponent {
  @Input() message: string = '';
  @Input() show: boolean = false;
  @Input() delay: number = 5000;
  @Input() type: 'success' | 'danger' | 'info' | 'warning' = 'success';
  @Output() closed = new EventEmitter<void>();
  @ViewChild('toastEl', { static: false }) toastEl!: ElementRef;

  ngOnChanges() {
    if (this.show) {
      setTimeout(() => {
        this.close();
      }, this.delay);
    }
  }

  close() {
    this.show = false;
    this.closed.emit();
  }
}
