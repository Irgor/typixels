import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserTypeService {

  constructor() { }

  $userTypeValue = signal('');
}
