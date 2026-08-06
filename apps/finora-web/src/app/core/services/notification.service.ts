import { inject, Injectable } from '@angular/core'; import { MatSnackBar } from '@angular/material/snack-bar';
@Injectable({providedIn:'root'}) export class NotificationService { private readonly bar=inject(MatSnackBar); error(message:string){this.bar.open(message,'Dismiss',{duration:5000});} }
