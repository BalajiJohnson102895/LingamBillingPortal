import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Einvoicing } from './einvoicing';

describe('Einvoicing', () => {
  let component: Einvoicing;
  let fixture: ComponentFixture<Einvoicing>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Einvoicing],
    }).compileComponents();

    fixture = TestBed.createComponent(Einvoicing);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
