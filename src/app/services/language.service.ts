import {Injectable, inject} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {TranslateService} from '@ngx-translate/core';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({providedIn: 'root'})
export class LanguageService {
  private valueLangSource = new BehaviorSubject<any>(null);

  private translate = inject(TranslateService);
  private httpClient = inject(HttpClient);

  private URL_API = 'https://quicksystemapi-intern.ezitouch.com:8543/v1/';

  // Danh sách cấu hình ngôn ngữ
  private Config_LanguageSource = new BehaviorSubject<any>([
    {
      LangID: 1,
      Title: 'LangVi',
      Value: "vi",
      ImgIcon: "/flag-vi.svg",
      IsActive: 1,
      LocalPath: "JsonLang/vi.json"
    },
    {
      LangID: 2,
      Title: 'LangEn',
      Value: "en",
      ImgIcon: "/flag-en.svg",
      IsActive: 1,
      LocalPath: "JsonLang/en.json"
    }
  ])
  Config_Language$ = this.Config_LanguageSource.asObservable();

  // Đọc file từ API
  File_Read(bodyData: any) {
    var header = new HttpHeaders({ 'Content-Type': 'Application/json' })
    return this.httpClient.post(this.URL_API + 'Utility/File_Read', bodyData,
      { params: {}, headers: header }
    )
  }

  public setLanguageDefault(langID: any) {
    let lang: any = null
    let configValue: any = this.Config_LanguageSource.getValue()
    if (configValue && configValue[0])
      lang = configValue.find((lang: any) => (lang.IsActive && lang.LangID == langID))

    if (!lang) {
      lang = configValue[0] || []
      langID = lang.LangID
    }
    // Gọi API lấy file ngôn ngữ
    if (lang.LocalPath && lang.LocalPath.length) {
      let bodyDta = {DataInput: {FilePath: lang.LocalPath}}
      this.File_Read(bodyDta).subscribe({
        next: (res: any) => {
          if (res.resultCode == "OK" && res.result) {
            this.translate.setTranslation(lang?.Value, res.result);
            this.translate.use(lang?.Value);

            localStorage.setItem("LangID", langID);
            this.valueLangSource.next(lang)
          } else this.getLangDefault(lang)
        },
        error: (err: any) => {
          this.getLangDefault(lang)
        }
      })
    } else this.getLangDefault(lang)
  }

  // Hàm lấy ngôn ngữ default
  private getLangDefault(lang: any) {
    this.httpClient.get(`/assets/i18n/${lang.Value}.json?` + String(Date.now())).subscribe(
      (res: any) => {
        this.translate.setTranslation(lang?.Value, res);
        this.translate.use(lang?.Value);

        localStorage.setItem("LangID", lang.LangID);
        this.valueLangSource.next(lang)
      },
      (error: any) => {
        console.error('Could not load translations', error);
      }
    );
  }
}
