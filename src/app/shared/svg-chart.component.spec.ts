import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SvgChartComponent } from './svg-chart.component';

describe('SvgChartComponent', () => {
  let component: SvgChartComponent;
  let fixture: ComponentFixture<SvgChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SvgChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SvgChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return 0 height for empty data', () => {
    component.data = [];
    expect(component.heightPct(50)).toBe(0);
  });

  it('should calculate height percentage correctly', () => {
    component.data = [
      { label: 'A', value: 50 },
      { label: 'B', value: 100 },
    ];
    expect(component.heightPct(50)).toBe(50);
    expect(component.heightPct(100)).toBe(100);
  });

  it('should clamp values to max', () => {
    component.data = [{ label: 'A', value: 200 }];
    component.maxValue = 100;
    component.ngOnChanges();
    expect(component.data[0].value).toBe(100);
  });

  it('should show empty message when no data', () => {
    component.data = [];
    component.emptyMessage = 'No data available';
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No data available');
  });
});
