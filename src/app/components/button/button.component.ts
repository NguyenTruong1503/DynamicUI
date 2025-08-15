import {Component, inject, OnInit, viewChild} from '@angular/core';
import {FormsModule, NgForm} from "@angular/forms";
import {NgxDatatableModule} from "@siemens/ngx-datatable";
import {ModuleService} from '../../services/module-service.service';
import {firstValueFrom} from 'rxjs';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {DropDownListAllModule} from '@syncfusion/ej2-angular-dropdowns';
import {FilterSettingsModel, GridAllModule, ToolbarItems} from '@syncfusion/ej2-angular-grids';
import {DEFAULT_PAGE_OPTIONS} from '../../shared/constants';
import {TranslatePipe} from '@ngx-translate/core';



@Component({
  selector: 'app-button',
  standalone: true,
  imports: [
    FormsModule,
    NgxDatatableModule,
    NgClass,
    NgIf,
    DropDownListAllModule,
    GridAllModule,
    TranslatePipe
  ],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent implements OnInit{
  readonly grid = viewChild.required<any>('grid');
  readonly formButton = viewChild.required<NgForm>('f');

  // Service
  dataService = inject(ModuleService);

  listButtons: any[] = [];
  listScreens: any[] = [];
  listStyles: any[] = [];
  listModalOfScreen: any[] = [];
  listButtonOfModal: any[] = [];
  listProcessButtonOfModal: any[] = [];
  valueButtonBody: any = {};
  valueButton: any = {
    ButtonID: null,
    ButtonCode: "",
    ButtonName: ""
  };
  valueSelectedScreen: string = "";
  valueSelectedModal: string = '';
  is_Check_Update: boolean = false;
  is_CheckUpdateButtonOfModal: boolean = false;

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
    sortSettings: {
      columns: [
        {
          field: 'DisplayOrder', direction: 'desc'
        },
        {
          field: 'isUpdated', direction: 'desc'
        }
      ]
    },
    pageSettings: { pageCount: 10, pageSize: 100 },

    // Có thể thêm tùy chọn mở rộng ở đây nếu cần:
    expandOnClick: true,
    allowExcelExport: false,
    allowPdfExport: false,
  }
  public filterSetting!: FilterSettingsModel;
  public buttonToolbar: ToolbarItems[] = ['Search']
  pageOptions = DEFAULT_PAGE_OPTIONS;


  async ngOnInit(): Promise<void> {
    this.filterSetting = {type: 'CheckBox'}
    await this.Button_GetList();
    await this.Screen_GetList();
    await this.StyleCss_GetList();
  }

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

  // Hàm ấn lưu
  async onSubmit() {
    await this.Button_InsertUpdateDelete(this.valueButton);
    this.onClear(this.formButton())
  }

  // Hàm xử lý lưu button vào modal
  async onSave() {
    if (this.is_CheckUpdateButtonOfModal) {
      let dataInput = this.listProcessButtonOfModal.filter(button => button.isNewlyAdded || button.isUpdated || (button.isInModal && button.isSelected));
      // this.normalizeDisplayOrder(dataInput);
      let dataButton = dataInput.map(btn => ({
        ButtonID: btn.ButtonID,
        DisplayOrder: btn.DisplayOrder
      }))
      await this.Button_InsertUpdateOfModal({ModalID: this.valueSelectedModal}, {Button: dataButton});
    }
    this.is_CheckUpdateButtonOfModal = false;
  }

  // Hàm xử lý xoá row
  async onDeleteRow() {
    let valueRowDelete = {...this.valueButton, IsDelete: 1};
    await this.Button_InsertUpdateDelete(valueRowDelete);
    this.onClear(this.formButton());
  }

  //Hàm ấn Làm mới
  onClear(f: NgForm) {
    this.valueButton = {ButtonID: 0}
    this.is_Check_Update = false;
    f.resetForm();
    this.grid().clearSelection();
  }

  // Hàm reset khi chọn button cho modal
  async onResetChoose() {
    await this.Button_GetList({ScreenID: this.valueSelectedScreen, ModalID: this.valueSelectedModal});
    this.is_CheckUpdateButtonOfModal = false;
  }

  // Hàm kiểm tra xem đã chọn modal hay chưa
  hasSelectedModal(){
    return !(this.valueSelectedModal === "" || this.valueSelectedModal === undefined);
  }

  // Hàm xử lý lưu check box
  onCheckboxChange(row: any, event: any) {
    const isChecked = event.target.checked;
    this.is_CheckUpdateButtonOfModal = true;
    if (isChecked) {
      this.listProcessButtonOfModal = this.listProcessButtonOfModal.map(button => {
        if (button.ButtonID === row.ButtonID) {
          let newDisplayOrder = 1;
          if ((this.valueSelectedModal && this.listButtonOfModal.length > 0) || (this.valueSelectedModal && this.listProcessButtonOfModal.length > 0)) {
            const maxDisplayOrder = Math.max(0, ...this.listProcessButtonOfModal.map(b => b.DisplayOrder));
            newDisplayOrder = maxDisplayOrder + 1;
          }
          return {
            ...button,
            isSelected: true,
            isNewlyAdded: true,
            DisplayOrder: newDisplayOrder
          }
        }
        return button;
      })
    } else {
      this.listProcessButtonOfModal = this.listProcessButtonOfModal.map(button => {
        if (button.ButtonID === row.ButtonID) {
          if (button.isInModal) {
            return {
              ...button,
              isSelected: false,
              isUpdated: true,
              DisplayOrder: 0,
              isNewlyAdded: false
            }
          }else {
            return {
              ...button,
              isSelected: false,
              isUpdated: false,
              isNewlyAdded: false,
              DisplayOrder: 0
            }
          }
        }
        return button;
      })
    }
  }

  // Hàm xử lý DisplayOrder thay đổi
  onDisplayOrderChange(row: any, event: any) {
    this.is_CheckUpdateButtonOfModal = true;
    const newValue = parseInt(event.target.value) || 0;
    this.listProcessButtonOfModal = this.listProcessButtonOfModal.map(button => {
      if (button.ButtonID === row.ButtonID) {
        if (button.isInModal) {
          return {
            ...button,
            DisplayOrder: newValue,
            isUpdated: true,
          }
        } else {
          return {
            ...button,
            DisplayOrder: newValue
          }
        }
      }
      return button;
    })
  }

  // Hàm xử lý khi chọn row
  onActivate(e: any) {
    const rowData = e.data;
    this.valueButton = {...rowData};
    this.is_Check_Update = true;
  }

  // Hàm xử lý khi bỏ chọn row
  onDeActivate(e: any) {
    this.onClear(this.formButton());
  }

  // Hàm lấy STT theo phân trang
  getRowIndex(data: any){
    const currentPage = this.grid().pageSettings?.currentPage ?? 1;
    const pageSize = this.grid().pageSettings?.pageSize ?? 10;
    return (currentPage - 1) * pageSize + (+data.index + 1)
  }

  //Hàm xử lý khi chọn lọc Screen
  async onChangeScreenSearchModal(value: any) {
    if (value) {
      await this.Modal_GetList({ScreenID: value});
      this.valueSelectedModal = this.listModalOfScreen[0]?.ModalID;
      await this.onChangeModalSearchButton(this.valueSelectedModal);

    } else {
      await this.Button_GetList();
      this.valueSelectedModal = '';
    }
    this.is_CheckUpdateButtonOfModal = false;
  }

  // Hàm xử lý khi chọn lọc modal
  async onChangeModalSearchButton(event : any) {
    if (event) {
      await this.Button_GetList({ScreenID: this.valueSelectedScreen, ModalID: this.valueSelectedModal});
    }
    this.is_CheckUpdateButtonOfModal = false;
  }

  // Hàm gọi List Button
  async Button_GetList(body: any = {}) {
    this.valueButtonBody = {...body};
    const storedName = 'sp_Button_GetList';
    const tableName = 'List_Button'
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({DataInput: this.valueButtonBody}, storedName, tableName));
      if (res.resultCode == 'OK' && res?.result) {
        if (Object.keys(this.valueButtonBody).length === 0) {
          this.listButtons = res.result.List_Button || [];
          this.listButtonOfModal = [];
          this.processButtonOfModal()
        } else {
          this.listButtonOfModal = res?.result.List_Button || [];
          console.log("List:", this.listButtonOfModal)
          this.processButtonOfModal();
          console.log("Value",this.listProcessButtonOfModal)
        }
      }
    } catch (err: any) {
      console.log(err);
    }
  }

  // Hàm xử lý gọi GetList cho Screen
  async Screen_GetList(body: any = {}) {
    this.valueButtonBody = {...body};
    const storedName = 'sp_Screen_GetList';
    const tableName = 'List_Screen';
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({DataInput: this.valueButtonBody}, storedName, tableName));
      if (res.resultCode == 'OK' && res?.result) {
        this.listScreens = res.result.List_Screen || [];
      }
    } catch (err: any) {
      console.log(err);
    }
  }

  // Hàm xử lý gọi GetList cho Modal
  async Modal_GetList(body: any = {}) {
    this.valueButtonBody = {...body};
    const storedName = 'sp_Modal_GetByScreen';
    const tableName = 'ListModal_GetByScreen';
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({DataInput: this.valueButtonBody}, storedName, tableName));
      if (res.resultCode == 'OK' && res?.result) {
        this.listModalOfScreen = res.result.ListModal_GetByScreen;
      }
    } catch (err: any) {
      console.log(err);
    }
  }

  // Hàm xử lý GetList cho Style
  async StyleCss_GetList(body: any = {}) {
    this.valueButtonBody = {...body};
    const storedName = 'sp_CssStyle_GetList';
    const tableName = 'ListStyleCss';
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({DataInput: this.valueButtonBody}, storedName, tableName));
      if (res.resultCode == 'OK' && res.result) {
        this.listStyles = res.result.ListStyleCss;
      }
    } catch (err: any) {
      console.error(err);
    }
  }

  // Hàm xử lý Insert Update Delete cho Button
  async Button_InsertUpdateDelete(body: any = {}) {
    this.valueButtonBody = {...body};
    const storedName = 'sp_Button_InsertUpdate';
    const tableName = 'StatusButtonInsertUpdate';
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({DataInput: this.valueButtonBody}, storedName, tableName));
      if (res.resultCode == 'OK' && res.result) {
        await this.Button_GetList();
        await this.Button_GetList({ScreenID: this.valueSelectedScreen, ModalID: this.valueSelectedModal});
      }
    } catch (err: any) {
      console.log(err);
    }
  }

  // Hàm xử lý Insert Update Button cho Modal
  async Button_InsertUpdateOfModal(body: any = {}, buttons: any = []) {
    this.valueButtonBody = {...body};
    const storedName = 'sp_ButtonOfModal_InsertUpdate';
    const tableName = "StatusButtonInsertUpdateOfModal";
    try {
      const res = await firstValueFrom(this.dataService.StoredDynamic_Exec({DataInput: this.valueButtonBody, Buttons: buttons }, storedName, tableName));
      if (res.resultCode == 'OK' && res.result) {
        await this.Button_GetList({ScreenID: this.valueSelectedScreen, ModalID: this.valueSelectedModal});
      }
    } catch (err: any) {
      console.log(err);
    }
  }

  // Hàm thêm các biến xử lý
  processButtonOfModal(){
    this.listProcessButtonOfModal = this.listButtons.map((button: any) => {
      const buttonModal = this.listButtonOfModal.find((bm: any) => bm.ButtonID === button.ButtonID && bm.DisplayOrder > 0);
      if (buttonModal) {
        return {
          ...button,
          isSelected: true,
          isInModal: true,
          DisplayOrder: buttonModal.DisplayOrder,
          isNewlyAdded: false,
          isUpdated: false,
        }
      } else {
        return {
          ...button,
          isSelected: false,
          isInModal: false,
          DisplayOrder: 0,
          isNewlyAdded: false,
          isUpdated: false,
        }
      }
    })
  }

  // Hàm xử lý rút gọn displayOrder
  // normalizeDisplayOrder(list: any[]) {
  //   const validList = list.filter((item: any) => item.DisplayOrder > 0);
  //   const sortedList = validList.sort((a, b) => {
  //     if (a.DisplayOrder === b.DisplayOrder) {
  //       return a.ButtonCode.localeCompare(b.ButtonCode);
  //     }
  //     return a.DisplayOrder - b.DisplayOrder;
  //   })
  //   sortedList.forEach((item, index) => {
  //     item.DisplayOrder = index + 1;
  //   })
  // }
}
