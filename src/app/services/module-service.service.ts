import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModuleService {

  private URL_API = 'https://quicksystemapi-intern.ezitouch.com:8543/v1/';

  constructor(private httpClient: HttpClient) { }

  // Api động thực hiện exec sp
  StoredDynamic_Exec(bodydata: any, storedName: string, tableName: string): Observable<any> {
    return this.httpClient.post(
      this.URL_API + 'Utility/StoredDynamic_Exec',
      bodydata,
      {
        params: {
          LangID: this.getLanguage(),
          StoredName: storedName,
          TableName: tableName
        },
        headers: this.getHeader()
      }
    );
  }

  private getLanguage(): number {
    return 1;
  }

  private getHeader(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }
}
