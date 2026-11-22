import { TestBed } from '@angular/core/testing';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { App } from './app';

describe('App', () => {
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        HttpClientTestingModule,
        RouterModule.forRoot([]),
      ],
      declarations: [
        App
      ],
    })
      .compileComponents();
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Iniciar sesión');
  });

  it('switches to the registration form without showing promotional content', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const registerLink = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((button) => button.textContent?.includes('Regístrate'));
    registerLink?.click();
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('h1')?.textContent).toContain('Crear una cuenta');
    expect(page.querySelector('aside')).toBeNull();
    expect(page.querySelector('form')).not.toBeNull();
    expect(page.querySelector('#register-first-name')).not.toBeNull();
    expect(page.querySelector('#register-last-name')).not.toBeNull();
  });

  it('shows the inventory after a successful login without reloading', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.credentials = { email: 'user@example.com', password: 'Password123!' };
    fixture.detectChanges();

    app.login();
    httpTesting.expectOne('/api/auth/login').flush({
      token: 'test-token',
      usuarioId: 1,
      email: 'user@example.com',
      nombre: 'Test',
      apellido: 'User',
    });

    httpTesting.expectOne('/api/productos').flush([]);
    httpTesting.expectOne('/api/lotes').flush([]);
    httpTesting.expectOne('/api/proveedores').flush([]);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('.app-shell')).not.toBeNull();
  });

  it('filters products by supplier name', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.products = [
      { id: 1, nombre: 'Café' },
      { id: 2, nombre: 'Té' },
    ];
    app.lots = [
      {
        idProducto: 1,
        nombreProducto: 'Café',
        idProveedor: 3,
        nombreProveedor: 'Distribuidora Andina',
        precio: 12,
        stock: 8,
      },
    ];
    app.searchTerm = 'andina';

    expect(app.filteredProducts.map((product) => product.id)).toEqual([1]);
  });

  it('does not offer a supplier already assigned to the selected product', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.suppliers = [
      { id: 3, nombre: 'Distribuidora Andina', direccion: '', ruc: '' },
      { id: 4, nombre: 'Comercial Norte', direccion: '', ruc: '' },
    ];
    app.selectedProduct = { id: 1, nombre: 'Café' };
    app.lots = [
      {
        idProducto: 1,
        nombreProducto: 'Café',
        idProveedor: 3,
        nombreProveedor: 'Distribuidora Andina',
        precio: 12,
        stock: 8,
      },
    ];

    expect(app.availableSuppliers.map((supplier) => supplier.id)).toEqual([4]);
  });
});
