import {Component, inject, OnDestroy, OnInit, TemplateRef, viewChild} from '@angular/core';
import {FormsModule, NgForm, ReactiveFormsModule} from '@angular/forms';
import {NgxDatatableModule, TableColumn} from '@siemens/ngx-datatable';
import {debounceTime, distinctUntilChanged, firstValueFrom, Subject, takeUntil} from 'rxjs';
import {ModuleService} from '../../services/module-service.service';
import {NgClass, NgIf} from '@angular/common';
import {DropDownListModule} from "@syncfusion/ej2-angular-dropdowns";
import {FilterSettingsModel, GridModule, ToolbarItems} from "@syncfusion/ej2-angular-grids";
import {DEFAULT_PAGE_OPTIONS} from '../../shared/constants';
import {TranslatePipe} from '@ngx-translate/core';


@Component({
  selector: 'app-parameter',
  standalone: true,
  imports: [
    FormsModule,
    NgxDatatableModule,
    ReactiveFormsModule,
    NgClass,
    NgIf,
    DropDownListModule,
    GridModule,
    TranslatePipe
  ],
  templateUrl: './parameter.component.html',
  styleUrl: './parameter.component.scss'
})
export class ParameterComponent implements OnInit {
  listParameters: any = [];
  valueParameter: any = {};
  valueParameterBody: any = {};
  valueSelectedRow: any = {};
  is_Check_Update: boolean = false;

  // Các biển của Grid Data
  gridConfig: any = {
    dataSource: [], //data dể hiển thị
    dataGridHeader: [], // Header
    query: {}, // điều kiện để lọc dữ liệu
    // rowHeight: '27', // chiều cao của row
    // gridHeight: '100%',//Math.ceil((window.innerHeight - 370) / 2), // chiều cao của grid
    // gridWidth: '100%', // chiều dài của grid

    enableHover: false, // bật/tắt sự kiện khi hover vào row
    enableHeaderFocus: false, // bật/tắt chọn focus vào thẻ header
    enableVirtualization: false, // bật/tắt hiệu ứng không hiển thị dữ liệu khi scroll nhanh

    allowReordering: false, // bật/tắt cho phép đổi vị trí cột
    allowSorting: true, // bật/tắt sắp xếp trên header
    allowFiltering: true, // bật/tắt lọc trên header
    allowGrouping: true, // bật/tắt gom nhóm dữ liệu trên header
    allowSelection: true, // bật/tắt chọn dòng dữ liệu
    allowResizing: false,
    allowPaging: false,

    allowTextWrap: true,
    textWrapSettings: { wrapMode: 'Content' },

    showColumnMenu: true, // bật/tắt hiển thị menu action trên header
    autoFit: true,

    editSettings: null, // Chỉnh sửa
    toolbar: [], // ['Add', 'Edit', 'Delete', 'Update', 'Cancel'] nếu cần

    loadingIndicator: { indicatorType: 'Spinner' }, // cấu hình hiệu ứng load row dữ liệu
    selectionSettings: { type: 'Single', persistSelection: false },//{ type: 'Single', checkboxMode: 'ResetOnRowClick', mode: 'Row' }, // cấu hình chọn row dữ liệu
    filterSettings: { type: "Menu" }, // cấu hình giao diện hiển thị filter
    groupSettings: { showGroupedColumn: true }, // cấu hình gom nhóm dữ liệu trên header
    pageSettings: { pageCount: 10, pageSize: 100 },

    // Có thể thêm tùy chọn mở rộng ở đây nếu cần:
    expandOnClick: true,
    allowExcelExport: false,
    allowPdfExport: false,
  }
  public filterSetting!: FilterSettingsModel;
  public buttonToolbar: ToolbarItems[] = ['Search']
  pageOptions = DEFAULT_PAGE_OPTIONS;

  // Data service
  dataService = inject(ModuleService);

  readonly grid = viewChild.required<any>('grid');
  readonly formTemplate = viewChild.required<NgForm>('f');

  async ngOnInit(): Promise<void> {
    this.filterSetting = {type:'CheckBox'}
    await this.Parameter_GetList();
  }

  // Hàm tạo mới và cập nhật Parameter
  async onSubmit() {
    await this.Parameter_InsertUpdateDelete(this.valueParameter);
    this.onClear(this.formTemplate());
  }

  // Hàm xoá Parameter
  async onDelete() {
    let valueParamDelete = {...this.valueParameter, IsDelete: 1};
    await this.Parameter_InsertUpdateDelete(valueParamDelete);
    this.onClear(this.formTemplate());
  }

  onClear(f: NgForm) {
    this.valueParameter = {}
    this.is_Check_Update = false;
    f.resetForm();
    this.grid().clearSelection();
  }

  onActivate(e: any) {
    const rowData = e.data;
    this.valueParameter = {...rowData};
    this.is_Check_Update = true;
  }

  // Hàm xử lý lấy stt
  getRowIndex (data: any) {
    const currentPage = this.grid().pageSettings?.currentPage ?? 1;
    const pageSize = this.grid().pageSettings?.pageSize ?? 10;
    return (currentPage - 1) * pageSize + (+data.index + 1);
  }

  // Hàm xử lý GetList cho Parameter
  async Parameter_GetList(body: any = {}) {
    this.valueParameterBody = {...body};
    const storedName = 'sp_Parameter_GetList';
    const tableName = 'ListParameter';
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({DataInput: this.valueParameterBody}, storedName, tableName));
      if (res.resultCode == "OK" && res.result) {
        this.listParameters = res.result.ListParameter;
      }
    } catch (err: any) {
      console.log(err);
    }
  }

  // Hàm xử lý Insert Update Delete cho Parameter
  async Parameter_InsertUpdateDelete(body: any = {}) {
    this.valueParameterBody = {...body};
    const storedName = 'sp_Parameter_InsertUpdate';
    const tableName = 'ListParameter';
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({DataInput: this.valueParameterBody}, storedName, tableName));
      if (res.resultCode == "OK" && res.result) {
        await this.Parameter_GetList();
      }
    } catch (err: any) {
      console.log(err);
    }
  }

}
