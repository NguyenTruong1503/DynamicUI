import {Component, inject, OnInit} from '@angular/core';
import { RouterOutlet } from "@angular/router";
import {LanguageService} from './services/language.service';
import {TranslateService} from '@ngx-translate/core';
import {Title} from '@angular/platform-browser';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit{
  private titleService = inject(Title);

  appConfig = inject(LanguageService);
  translate:any = inject(TranslateService);

  ngOnInit(): void {
    // get ngôn ngữ từ localStorage
    this.titleService.setTitle('DynamicUI - F2TECH');
    if (localStorage.getItem("LangID") && Number(localStorage.getItem("LangID")) / Number(localStorage.getItem("LangID")) == 1)
      this.appConfig.setLanguageDefault(localStorage.getItem("LangID"))
    else this.appConfig.setLanguageDefault(1)
  }

}
