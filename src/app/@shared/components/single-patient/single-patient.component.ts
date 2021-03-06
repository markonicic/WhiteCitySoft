import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Doctors } from '@app/@shared/interfaces/doctors.model';
import { Patient } from '@app/@shared/interfaces/patient.model';

@Component({
  selector: 'app-single-patient',
  templateUrl: './single-patient.component.html',
  styleUrls: ['./single-patient.component.scss'],
})
export class SinglePatientComponent implements OnInit, OnChanges {
  checked = false;

  advancedForm: FormGroup;

  @Input() title: string;
  @Input() mode: string;
  @Input() patient: Patient;
  @Input() doctors: Doctors[];
  filteredDoctors: Doctors[];

  @Output() emitPatient = new EventEmitter();
  @Output() actionMode = new EventEmitter();

  addressTypes = [
    { title: 'Home', value: 'HOME' },
    { title: 'Second Home', value: 'SECOND_HOME' },
    { title: 'Work', value: 'WORK' },
    { title: 'Holiday', value: 'HOLIDAY' },
    { title: 'Relative', value: 'RELATIVE' },
  ];

  maxDate = new Date();

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(): void {
    this.filteredDoctors = this.doctors;
    if (this.patient && this.doctors) {
      let dataForm: any = this.patient;
      this.doctors.find((data) => {
        if (data.id === this.patient.doctor) {
          dataForm.doctor = data.firstName + ' ' + data.lastName + ', ' + data.title;
        }
      });
      this.advancedForm.patchValue(dataForm);
      this.advancedForm.disable();
    }
  }

  get f(): FormArray {
    return this.advancedForm.get('addresses') as FormArray;
  }

  isTypeExist(i: number): boolean {
    const formItem = this.f.at(i);
    if (formItem.get('type').value === 'WORK' || formItem.get('type').value === 'RELATIVE') {
      return true;
    }
    return false;
  }

  onAddAddress(): void {
    this.f.push(this.newFormAddress());
  }

  onRemoveAddress(i: number): void {
    this.f.removeAt(i);
  }

  isPatientAdoult(): void {
    const birthDateValue = this.advancedForm.get('birthDate').value;
    const today = new Date();
    const birthDate = new Date(birthDateValue);
    let age = today.getFullYear() - birthDate.getFullYear();
    let m = today.getMonth() - birthDate.getMonth();
    let da = today.getDate() - birthDate.getDate();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (m < 0) {
      m += 12;
    }
    if (da < 0) {
      da += 30;
    }

    if (age >= 18) {
      this.advancedForm.get('vatCode').markAsTouched();
      return this.advancedForm.get('vatCode').setErrors({ age: age });
    }
    this.advancedForm.get('vatCode').reset();
    return this.advancedForm.get('vatCode').setErrors(null);
  }

  onEdit(): void {
    this.mode = 'edit';
    this.title = 'Edit Patient';
    this.advancedForm.enable();
    window.scrollTo(0, 0);
  }

  onPatientAction(mode: string): void {
    if (this.mode === 'edit') {
      mode = this.mode;
    }
    this.actionMode.emit(mode);
    if (mode !== 'save') {
      this.advancedForm.addControl('id', new FormControl(this.patient.id));
    }
    if (mode !== 'delete') {
      this.f.controls.forEach((element) => {
        const phone = element.get('phone').value;
        element.get('phone').patchValue(phone.replace(/\s/g, ''));
      });
    }
    this.emitPatient.emit(this.advancedForm.value);
  }

  initForm() {
    this.advancedForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      birthDate: ['', Validators.required],
      vatCode: [''],
      doctor: ['', Validators.required],
      addresses: this.fb.array([this.newFormAddress()]),
    });
  }

  /**
   * Add new address block to form array
   * @return FormGroup
   */
  newFormAddress(): FormGroup {
    return this.fb.group({
      type: new FormControl('HOME', Validators.required),
      name: new FormControl(''),
      street: new FormControl('', Validators.required),
      phone: new FormControl('+39', [
        Validators.required,
        Validators.pattern(/^\+?[0-9\s]+$/),
        Validators.minLength(9),
      ]),
      email: ['', [Validators.required, Validators.email]],
      city: new FormControl('', Validators.required),
      country: new FormControl('', Validators.required),
      zipcode: new FormControl('', Validators.required),
    });
  }

  filterDoctors(e: Event) {
    const filterValue = (<HTMLInputElement>e.target).value.toLowerCase();

    this.filteredDoctors = this.doctors.filter((data: Doctors) => {
      const fullName = data.firstName + ' ' + data.lastName;
      if (fullName.toLowerCase().includes(filterValue)) {
        return data;
      }
    });
  }
}
