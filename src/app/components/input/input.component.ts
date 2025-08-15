import {Component, inject, OnDestroy, OnInit, TemplateRef, ViewChild, viewChild} from '@angular/core';
import {NgxDatatableModule, TableColumn} from '@siemens/ngx-datatable';
import {FormsModule, NgForm} from '@angular/forms';
import {ModuleService} from '../../services/module-service.service';
import {filter, firstValueFrom} from 'rxjs';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {FilterSettingsModel, GridAllModule, GridComponent, ToolbarItems} from '@syncfusion/ej2-angular-grids';
import {DropDownListAllModule} from '@syncfusion/ej2-angular-dropdowns';
import {DEFAULT_PAGE_OPTIONS} from '../../shared/constants';
import {TranslatePipe} from '@ngx-translate/core';


@Component({
  selector: 'app-input',
  standalone: true,
  imports: [
    NgxDatatableModule,
    FormsModule,
    NgClass,
    NgIf,
    GridAllModule,
    DropDownListAllModule,
    TranslatePipe
  ],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss'
})
export class InputComponent implements OnInit {

  readonly grid = viewChild.required<GridComponent>('grid');
  readonly formInput = viewChild.required<NgForm>('f');

  listInput: any[] = [];
  listParameter: any = [];
  listStyle: any = [];
  listScreens: any = [];
  listModalByScreen: any = [];
  listInputByModal: any[] = [];
  valueInputBody: any = {}
  valueSelectedRow: any = {}
  valueSelectedScreen: string = '';
  valueSelectedModal: string = '';
  valueInput: any = {
    InputID: null,
    InputCode: "",
    InputName: "",
    ParameterCode: "",
    StyleCode: "",
  }
  processedInput: any = [];
  is_Check_Update: boolean = false;
  is_CheckUpdateInputOfModal: boolean = false;

  // Biến trong Grid Data
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
    sortSettings: {
      columns: [
        {field: 'DisplayOrder', direction: 'Descending'},
        {field: 'isUpdated', direction: 'Descending'},
      ]
    },

    allowTextWrap: true,
    textWrapSettings: {wrapMode: 'Content'},

    showColumnMenu: true, // bật/tắt hiển thị menu action trên header
    autoFit: true,

    editSettings: null, // Chỉnh sửa
    toolbar: [], // ['Add', 'Edit', 'Delete', 'Update', 'Cancel'] nếu cần

    loadingIndicator: {indicatorType: 'Spinner'}, // cấu hình hiệu ứng load row dữ liệu
    selectionSettings: {type: 'Single', persistSelection: false},//{ type: 'Single', checkboxMode: 'ResetOnRowClick', mode: 'Row' }, // cấu hình chọn row dữ liệu
    filterSettings: {type: "Menu"}, // cấu hình giao diện hiển thị filter
    groupSettings: {showGroupedColumn: true}, // cấu hình gom nhóm dữ liệu trên header
    pageSettings: {pageCount: 10, pageSize: 100},

    // Có thể thêm tùy chọn mở rộng ở đây nếu cần:
    expandOnClick: true,
    allowExcelExport: false,
    allowPdfExport: false,
  }
  public filterSetting!: FilterSettingsModel;
  public inputToolbar: ToolbarItems[] = ['Search'];
  pageOptions = DEFAULT_PAGE_OPTIONS;

  // Service
  dataService = inject(ModuleService);

  async ngOnInit(): Promise<void> {
    this.filterSetting = {type: 'CheckBox'};
    await this.Input_GetList();
    await this.StyleCss_GetList();
    await this.Parameter_GetList();
    await this.Screens_GetList();
  }

  // Hàm xử lý thay đổi khi chọn screen
  async onChangeScreen(value: any) {
    if (value) {
      await this.Modal_GetByScreen({ScreenID: value});
      this.valueSelectedModal = this.listModalByScreen[0]?.ModalID;
      await this.onChangeModal(this.valueSelectedModal);
      this.is_CheckUpdateInputOfModal = false;
    }
  }

  // Hàm xử lý thay dổi khi chọn modal
  async onChangeModal(value: any) {
    console.log("Value Modal: ", value);
    if (value) {
      await this.Input_GetList({ScreenID: this.valueSelectedScreen, ModalID: this.valueSelectedModal});
    } else {
      await this.Input_GetList();
    }
  }

  // Hàm xử lý Insert Update Input
  async onSubmit() {
    await this.Input_InsertUpdateDelete(this.valueInput);
    this.onClear(this.formInput())
  }

  // Hàm xử lý Save Insert Update Input vào modal
  async onSave(){
    let data = this.processedInput.filter((inp: any) => inp.isNewlyAdded || inp.isUpdated || (inp.isInModal && inp.isSelected));
    // this.normalizeDisplayOrder(data);
    let dataInput = data.map((inp: any) => ({
      InputID: inp.InputID,
      DisplayOrder: inp.DisplayOrder
    }));
    await this.Input_InsertUpdateOfModal({ModalID: this.valueSelectedModal}, {InputItem: dataInput});
    this.is_CheckUpdateInputOfModal = false;
  }

  // Thêm class vào rowDataBound
  rowDataBound(e: any) {
    const data = e.data;
    const row = e.row as HTMLElement;
    if (data.isUpdated) {
      row.classList.add('filter-updated');
    } else if (data.isInModal && !data.isNewlyAdded && data.DisplayOrder > 0) {
      row.classList.add('filter-in-modal');
    } else if (data.isNewlyAdded) {
      row.classList.add('filter-newly-added');
    } else {
      row.classList.add('filter-default');
    }
  }

  // Hàm xử lý lấy giá trị từ row đã chọn
  onActivate(event: any) {
    const rowData = event.data;
    this.valueInput = {...rowData};
    this.valueSelectedRow = rowData;
    this.is_Check_Update = true;
  }

  // Hàm xử lý Deselect row
  onDeActivate(event: any) {
    this.onClear(this.formInput())
  }

  // Hàm xử lý nút Làm mới
  onClear(f: NgForm) {
    this.valueInput = {InputID: 0}
    this.is_Check_Update = false;
    f.resetForm();
    this.grid().clearSelection();
  }

  // Hàm xử lý nút Reset
  async onResetChoose() {
    this.is_CheckUpdateInputOfModal = false;
    await this.Input_GetList({ScreenID: this.valueSelectedScreen, ModalID: this.valueSelectedModal});
  }

  // Hàm xử lý lưu checkbox khi chọn
  onCheckboxChange(row: any, event: any) {
    const isChecked = event.target.checked;
    this.is_CheckUpdateInputOfModal = true;
    if (isChecked) {
      this.processedInput = this.processedInput.map((input: any) => {
        if (input.InputID === row.InputID) {
          let newDisplayOrder = 1;
          if ((this.valueSelectedModal && this.listInputByModal.length > 0) || (this.valueSelectedModal && this.processedInput.length > 0)) {
            const maxDisplayOrder = Math.max(0, ...this.processedInput.map((i: any) => i.DisplayOrder));
            newDisplayOrder = maxDisplayOrder + 1;
          }
          return {
            ...input,
            isSelected: true,
            isNewlyAdded: true,
            DisplayOrder: newDisplayOrder,
          }
        }
        return input;
      })
    } else {
      this.processedInput = this.processedInput.map((input: any) => {
        if (input.InputID === row.InputID) {
          if (row.isInModal) {
            return {
              ...input,
              isSelected: false,
              isNewLyAdded: false,
              DisplayOrder: 0,
              isUpdated: true
            }
          }
          return {
            ...input,
            isSelected: false,
            isNewlyAdded: false,
            DisplayOrder: 0,
          }
        }
        return input;
      })
    }
  }

  // Hàm xử lý xoá Input
  async onDeleteRow() {
    let valueRowDelete = {...this.valueInput, IsDelete: 1}
    await this.Input_InsertUpdateDelete(valueRowDelete);
    this.onClear(this.formInput());
  }

  // Kiểm tra xem đã chọn modal
  hasModalSelected() {
    if (this.valueSelectedModal === '' || this.valueSelectedModal === undefined)
      return false;
    return true;
  }

  // Hàm xử lý thay đổi DisplayOrder
  async onDisplayOrderChange(row: any, event: any) {
    this.is_CheckUpdateInputOfModal = true;
    const newValue = parseInt(event.target.value) || 0;

    this.processedInput = this.processedInput.map((input: any) => {
      if (input.InputID === row.InputID) {
        if (input.isInModal) {
          return {
            ...input,
            DisplayOrder: newValue,
            isUpdated: true,
          };
        }
        return {
          ...input,
          DisplayOrder: newValue,
        };
      }
      return input;
    });
  }

  // Hàm xử lý lấy phân trang
  getRowIndex(data: any): number {
    const currentPage = this.grid().pageSettings?.currentPage ?? 1;
    const pageSize = this.grid().pageSettings?.pageSize ?? 10;

    return (currentPage - 1) * pageSize + (+data.index) + 1;
  }

  // Hàm List Input
  async Input_GetList(body: any = {}) {
    this.valueInputBody = {...body};
    const storedName = 'sp_Input_GetList';
    const tableName = 'ListInputs';

    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({DataInput: this.valueInputBody}, storedName, tableName));
      if (res.resultCode == 'OK' && res?.result) {
        if (Object.keys(this.valueInputBody).length === 0) {
          this.listInput = res.result.ListInputs || [];
          this.listInputByModal = []
          this.processInputsDisplay();
        } else {
          this.listInputByModal = res.result.ListInputs || [];
          this.processInputsDisplay();
        }

      }
    } catch (err: any) {
      console.log(err);
    }
  }

  // Hàm xử lý GetList StyleCss
  async StyleCss_GetList(body: any = {}) {
    this.valueInputBody = {...body};
    const storedName = 'sp_CssStyle_GetList';
    const tableName = 'ListStyleCss';
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({DataInput: this.valueInputBody}, storedName, tableName));
      if (res.resultCode == 'OK' && res.result) {
        this.listStyle = res.result.ListStyleCss;
      }
    } catch (err: any) {
      console.log(err);
    }
  }

  // Hàm xử lý GetList Parameter
  async Parameter_GetList(body: any = {}) {
    this.valueInputBody = {...body};
    const storedName = 'sp_Parameter_GetList';
    const tableName = 'ListParameters';
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({DataInput: this.valueInputBody}, storedName, tableName));
      if (res.resultCode == 'OK' && res.result) {
        this.listParameter = res.result.ListParameters || [];
      }
    } catch (err: any) {
      console.log(err);
    }
  }

  // Hàm xử lý Insert Update Delete cho Input
  async Input_InsertUpdateDelete(body: any = {}) {
    this.valueInputBody = {...body};
    const storedName = 'sp_Input_InsertUpdate';
    const tableName = 'StatusInput'
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({DataInput: this.valueInputBody}, storedName, tableName));
      if (res.resultCode == 'OK' && res.result) {
        await this.Input_GetList();
        await this.Input_GetList({ScreenID: this.valueSelectedScreen, ModalID: this.valueSelectedModal});
      }
    } catch (err: any) {
      console.log(err);
    }
  }

  // Hàm xử lý gọi GetList cho Screen
  async Screens_GetList(body: any = {}) {
    this.valueInputBody = {...body};
    const storedName = 'sp_Screen_GetList';
    const tableName = 'ListScreens';
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({DataIndex: this.valueInputBody}, storedName, tableName));
      if (res.resultCode == 'OK' && res.result) {
        this.listScreens = res.result.ListScreens;
      }
    } catch (e: any) {
      console.error(e);
    }
  }

  // Hàm xử lý gọi GetList cho Modal
  async Modal_GetByScreen(body: any = {}) {
    this.valueInputBody = {...body};
    const storedName = 'sp_Modal_GetByScreen';
    const tableName = 'ListModalByScreen';
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({DataInput: this.valueInputBody}, storedName, tableName));
      if (res.resultCode == 'OK' && res.result) {
        this.listModalByScreen = res.result.ListModalByScreen || [];
      }
    } catch (e: any) {
      console.error(e);
    }
  }

  // Hàm xử lý Insert Update Input vào Modal
  async Input_InsertUpdateOfModal(body: any = {}, inputs: any = {}) {
    this.valueInputBody = {...body};
    const storedName = 'sp_InputOfModal_InsertUpdate';
    const tableName = 'ListInputOfModal';
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({DataInput: this.valueInputBody, Inputs: inputs}, storedName, tableName));
      if (res.resultCode == 'OK' && res.result) {
        await this.Input_GetList({ScreenID: this.valueSelectedScreen, ModalID: this.valueSelectedModal});
      }
    } catch (e: any) {
      console.error(e);
    }
  }

  // Hàm xử lý thêm và update các thuoc tín ở listInput để xử lý hiển thị
  processInputsDisplay() {
    this.processedInput = this.listInput.map(input => {
      const modalInput = this.listInputByModal.find(item => item.InputID === input.InputID && item.DisplayOrder > 0);
      if (modalInput) {
        return {
          ...input,
          isSelected: true,
          isInModal: true,
          DisplayOrder: modalInput.DisplayOrder,
          isNewlyAdded: false,
          isUpdated: false,
        }
      } else {
        return {
          ...input,
          isSelected: false,
          isInModal: false,
          DisplayOrder: 0,
          isNewlyAdded: false,
          isUpdated: false,
        }
      }
    })
  }

  // normalizeDisplayOrder(list: any[]) {
  //   const validItem = list.filter(item => item.DisplayOrder > 0);
  //   const sorted = validItem.sort((a,b) => {
  //     if (a.DisplayOrder === b.DisplayOrder) {
  //       return a.InputCode.localeCompare(b.InputCode);
  //     }
  //     return a.DisplayOrder - b.DisplayOrder;
  //   })
  //   sorted.forEach((item, index) => {
  //     item.DisplayOrder = index + 1;
  //   })
  // }

}
