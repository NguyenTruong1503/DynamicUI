import {AfterViewInit, Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import {ModuleComponent} from '../module/module.component';
import {ScreenComponent} from '../screen/screen.component';
import {ModalComponent} from '../modal/modal.component';
import {InputComponent} from '../input/input.component';
import {ButtonComponent} from '../button/button.component';
import {FilterComponent} from '../filter/filter.component';
import {GridheaderComponent} from '../gridheader/gridheader.component';
import {ParameterComponent} from '../parameter/parameter.component';
import {CssStyleComponent} from '../css-style/css-style.component';
import {JsonFileComponent} from '../json-file/json-file.component';
import {Subscription} from 'rxjs';
import {DropDownListModule} from '@syncfusion/ej2-angular-dropdowns';
import {LanguageService} from '../../services/language.service';
import {NgForOf} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';
import {Title} from '@angular/platform-browser';

@Component({
  selector: 'app-ui-dynamic',
  standalone: true,
  imports: [NgbNavModule, RouterLink, ModuleComponent, ScreenComponent, ModalComponent, InputComponent, ButtonComponent, FilterComponent, GridheaderComponent, ParameterComponent, CssStyleComponent, DropDownListModule, NgForOf, ReactiveFormsModule, TranslatePipe, FormsModule],
  templateUrl: './ui-dynamic.component.html',
  styleUrl: './ui-dynamic.component.scss'
})
export class UiDynamicComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private subscriptions: Subscription | undefined;
  private languageService = inject(LanguageService);
  private titleService = inject(Title);

  readonly screenTab:string = 'screen';
  readonly moduleTab:string = 'module';
  readonly modalTab:string = 'modal';
  readonly buttonTab :string= 'button';
  readonly inputTab:string = 'input';
  readonly gridHeaderTab :string= 'gridheader';
  readonly filterTab:string = 'filter';
  readonly parameterTab:string = 'parameter';
  readonly cssStyleTab:string = 'cssstyle';
  readonly jsonFileTab:string = 'jsonfile';

  activeTab = '';
  activeTitle = '';
  showDatatable = false;
  listLanguage: any[] = [];
  valueLanguage!: any;

  ngAfterViewInit(): void {
      setTimeout(() => this.showDatatable = true)
  }

  setActiveTab(fragment: string | null) {
    fragment = fragment?.toLowerCase() ?? this.moduleTab;
    const tabTitles = {
      [this.moduleTab]: "Module",
      [this.screenTab]: "Screen",
      [this.modalTab]: "Modal",
      [this.buttonTab]: "Button",
      [this.inputTab]: "Input",
      [this.gridHeaderTab]: "Grid Header",
      [this.filterTab]: "Filter",
      [this.parameterTab]: "Parameter",
      [this.cssStyleTab]: "CSS Style",
      [this.jsonFileTab]: "JSON File"
    };
    this.activeTitle = tabTitles[fragment] || "Module";
    this.activeTab = fragment;

  }



  switchLanguage(event: any) {
    this.languageService.setLanguageDefault(this.valueLanguage);
  }

  ngOnInit(): void {
    this.subscriptions = this.route.fragment.subscribe(fragment => this.setActiveTab(fragment));
    this.languageService.Config_Language$.subscribe(langs => {
      this.listLanguage = langs;
    })

    // Lấy lại ngôn ngữ đã lưu trong localStorage
    this.valueLanguage = localStorage.getItem('LangID');
    if (this.valueLanguage) {
      this.languageService.setLanguageDefault(this.valueLanguage);
    }
    this.titleService.setTitle('DynamicUI - F2TECH');
  }



}
