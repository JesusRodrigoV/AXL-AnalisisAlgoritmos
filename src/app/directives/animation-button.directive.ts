import {
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
} from '@angular/core';

@Directive({
  selector: '[appAnimationButton]',
})
export class AnimationButtonDirective {
  constructor(private el: ElementRef) {
    // Establecer estilos base
    this.setBaseStyles();
  }

  private setBaseStyles() {
    Object.assign(this.el.nativeElement.style, {
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      transform: 'scale(1)',
      position: 'relative',
      overflow: 'hidden',
    });
  }

  @HostBinding('style.transform') transform: string = 'scale(1)';
  @HostBinding('style.box-shadow') boxShadow: string =
    '0 2px 4px rgba(0,0,0,0.2)';

  @HostListener('mouseenter') onMouseEnter() {
    this.transform = 'scale(1.05)';
    this.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
    this.el.nativeElement.style.backgroundColor = '#007bff';
    this.el.nativeElement.style.color = 'white';
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.transform = 'scale(1)';
    this.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    this.el.nativeElement.style.backgroundColor = '';
    this.el.nativeElement.style.color = '';
  }

  @HostListener('mousedown') onMouseDown() {
    this.transform = 'scale(0.95)';
    this.boxShadow = '0 1px 2px rgba(0,0,0,0.2)';
  }

  @HostListener('mouseup') onMouseUp() {
    this.transform = 'scale(1.05)';
    this.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
  }
}
