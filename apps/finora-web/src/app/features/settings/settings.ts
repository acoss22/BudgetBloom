import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone:true,
  imports:[ReactiveFormsModule,MatButtonModule,MatCardModule,MatFormFieldModule,MatIconModule,MatInputModule],
  template:`
    <header><p class="eyebrow">YOUR ACCOUNT</p><h1>Settings</h1><p>Keep your profile and sign-in details current.</p></header>
    <div class="settings-grid"><mat-card><div class="card-title"><span><mat-icon>person</mat-icon></span><div><h2>Profile details</h2><p>Update the name and email used by your Finora account.</p></div></div><form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
      <mat-form-field><mat-label>Display name</mat-label><input matInput formControlName="displayName" autocomplete="name"></mat-form-field>
      <mat-form-field><mat-label>Email address</mat-label><input matInput type="email" formControlName="email" autocomplete="email"></mat-form-field>
      @if(profileError()){<p class="message error" role="alert">{{profileError()}}</p>}@if(profileSuccess()){<p class="message success" role="status"><mat-icon>check_circle</mat-icon>Profile updated.</p>}
      <button mat-flat-button type="submit" [disabled]="profileForm.invalid||savingProfile()">{{savingProfile()?'Saving…':'Save profile'}}</button>
    </form></mat-card>
    <mat-card><div class="card-title"><span><mat-icon>lock</mat-icon></span><div><h2>Change password</h2><p>Confirm your current password before choosing a new one.</p></div></div><form [formGroup]="passwordForm" (ngSubmit)="savePassword()">
      <mat-form-field><mat-label>Current password</mat-label><input matInput [type]="showCurrent()?'text':'password'" formControlName="currentPassword" autocomplete="current-password"><button mat-icon-button matSuffix type="button" (click)="showCurrent.update(value=>!value)" [attr.aria-label]="showCurrent()?'Hide current password':'Show current password'" [attr.aria-pressed]="showCurrent()"><mat-icon>{{showCurrent()?'visibility_off':'visibility'}}</mat-icon></button></mat-form-field>
      <mat-form-field><mat-label>New password</mat-label><input matInput [type]="showNew()?'text':'password'" formControlName="newPassword" autocomplete="new-password"><button mat-icon-button matSuffix type="button" (click)="showNew.update(value=>!value)" [attr.aria-label]="showNew()?'Hide new password':'Show new password'" [attr.aria-pressed]="showNew()"><mat-icon>{{showNew()?'visibility_off':'visibility'}}</mat-icon></button><mat-hint>At least 10 characters</mat-hint></mat-form-field>
      <mat-form-field><mat-label>Confirm new password</mat-label><input matInput [type]="showConfirm()?'text':'password'" formControlName="confirmPassword" autocomplete="new-password"><button mat-icon-button matSuffix type="button" (click)="showConfirm.update(value=>!value)" [attr.aria-label]="showConfirm()?'Hide password confirmation':'Show password confirmation'" [attr.aria-pressed]="showConfirm()"><mat-icon>{{showConfirm()?'visibility_off':'visibility'}}</mat-icon></button></mat-form-field>
      @if(passwordsDiffer()){<p class="message error">The new passwords do not match.</p>}@if(passwordError()){<p class="message error" role="alert">{{passwordError()}}</p>}@if(passwordSuccess()){<p class="message success" role="status"><mat-icon>check_circle</mat-icon>Password changed successfully.</p>}
      <button mat-flat-button type="submit" [disabled]="passwordForm.invalid||passwordsDiffer()||savingPassword()">{{savingPassword()?'Changing…':'Change password'}}</button>
    </form></mat-card></div>`,
  styles:[`header h1{font-size:clamp(1.8rem,4vw,2.6rem);margin:.15rem 0}.eyebrow{letter-spacing:.15em;color:#397454;font-weight:700}.settings-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-top:2rem;align-items:start}mat-card{padding:1.4rem}.card-title{display:flex;gap:1rem;margin-bottom:1.4rem}.card-title>span{display:grid;place-items:center;flex:0 0 46px;height:46px;border-radius:14px;background:#e3f1e6;color:#285844}.card-title h2{margin:0}.card-title p{margin:.25rem 0 0;color:#68766f}form{display:grid}mat-form-field{width:100%}form>button{margin-top:.6rem}.message{display:flex;align-items:center;gap:.4rem;margin:.1rem 0 1rem;font-size:.85rem}.message mat-icon{width:18px;height:18px;font-size:18px}.error{color:#b3261e}.success{color:#397454}@media(max-width:850px){.settings-grid{grid-template-columns:1fr}}`]
})
export class SettingsComponent {
  readonly auth=inject(AuthService); readonly user=this.auth.user(); readonly savingProfile=signal(false); readonly savingPassword=signal(false); readonly profileError=signal(''); readonly profileSuccess=signal(false); readonly passwordError=signal(''); readonly passwordSuccess=signal(false); readonly showCurrent=signal(false); readonly showNew=signal(false); readonly showConfirm=signal(false);
  readonly profileForm=new FormGroup({displayName:new FormControl(this.user?.displayName??'',{nonNullable:true,validators:[Validators.required]}),email:new FormControl(this.user?.email??'',{nonNullable:true,validators:[Validators.required,Validators.email]})});
  readonly passwordForm=new FormGroup({currentPassword:new FormControl('',{nonNullable:true,validators:[Validators.required]}),newPassword:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.minLength(10)]}),confirmPassword:new FormControl('',{nonNullable:true,validators:[Validators.required]})});
  passwordsDiffer(){const value=this.passwordForm.getRawValue();return !!value.confirmPassword&&value.newPassword!==value.confirmPassword;}
  saveProfile(){if(this.profileForm.invalid)return;this.savingProfile.set(true);this.profileError.set('');this.profileSuccess.set(false);this.auth.updateProfile(this.profileForm.getRawValue()).subscribe({next:()=>{this.savingProfile.set(false);this.profileSuccess.set(true)},error:error=>{this.savingProfile.set(false);this.profileError.set(this.errorMessage(error,'Could not update your profile.'))}});}
  savePassword(){if(this.passwordForm.invalid||this.passwordsDiffer())return;this.savingPassword.set(true);this.passwordError.set('');this.passwordSuccess.set(false);const value=this.passwordForm.getRawValue();this.auth.changePassword({currentPassword:value.currentPassword,newPassword:value.newPassword}).subscribe({next:()=>{this.savingPassword.set(false);this.passwordSuccess.set(true);this.passwordForm.reset({currentPassword:'',newPassword:'',confirmPassword:''})},error:error=>{this.savingPassword.set(false);this.passwordError.set(this.errorMessage(error,'Could not change your password.'))}});}
  private errorMessage(error:unknown,fallback:string){const response=error as {error?:{errors?:Record<string,string[]>;title?:string}};const messages=Object.values(response.error?.errors??{}).flat();return messages[0]??response.error?.title??fallback;}
}
