import { Component } from '@angular/core';
import { NorthwindService } from '../services';
import { System, $data, Northwind } from '../../jaydata-model/Northwind';
import { ProductsComponent } from './products.component';
import { ProductEditorComponent } from './product-editor.component';

@Component({
    selector: 'categories',
    templateUrl: './templates/categories.template.html',
    directives: [ProductsComponent, ProductEditorComponent]
})
export class CategoriesComponent {
    private categories = [];
    private context: System.Data.Objects.NorthwindContext
    private northwindService: NorthwindService

    constructor(northwindService: NorthwindService) {
        this.northwindService = northwindService;
        northwindService.getContext(
            context => this.OnContextLoaded(context)
        );
    }

    private OnContextLoaded(context) {
        this.context = context;
        this.sync(() => {
            this.context.Categories
            .toArray()
            .then(categories => this.categories = categories);
        });
    }

    public sync(cb){
        let now = Date.now();
        this.northwindService.getRemoteContext(remoteContext => {
            remoteContext.Categories.toArray().then(categories => {
                return Promise.all(categories.map(category => {
                    return category.getProperty<Northwind.Product[]>("Products").then(products => {
                        (<any>category).Sync = now;
                        category.Products = [];
                        return this.context.Categories.single(`it.Id == "${category.Id}"`).then((localCategory) => {
                            if ((<any>localCategory).Sync >= 0) this.context.Categories.attach(category, $data.EntityAttachMode.AllChanged);
                            return Promise.all(products.map(product => {
                                product.Category = category;
                                (<any>product).Sync = now;
                                return this.context.Products.single(`it.Id == "${product.Id}"`).then((localProduct) => {
                                    if ((<any>localProduct).Sync >= 0){
                                        this.context.Products.attach(product, $data.EntityAttachMode.AllChanged);
                                        category.Products.push(product);
                                    }else{
                                        category.Products.push(localProduct);
                                    }
                                }, () => {
                                    this.context.Products.add(product);
                                });
                            }));
                        }, () => {
                            products.forEach(product => {
                                (<any>product).Sync = now;
                                this.context.Products.add(product);
                            });
                            this.context.Categories.add(category);
                        });
                    });
                }));
            }).then(() => this.context.saveChanges().then(cb));
        });
    }

    private toggleSlider(products: ProductsComponent, slider: HTMLDivElement) {
        if (products.isActive) {
            slider.style.height = "0px";
        }
        else {
            slider.style.height = "100%";
        }
    }

    private OnClick(products: ProductsComponent, slider: HTMLDivElement) {
        this.toggleSlider(products, slider);

        products.openToggle();
    }

    private OnAdd(products: ProductsComponent, slider: HTMLDivElement) {
        products.open();
        slider.style.height = "100%";

        products.add()
    }

    private OnSync(){
        let now = Date.now();
        this.northwindService.getRemoteContext(remoteContext => {
            this.context.Products.include("Category").filter("it.Sync == -1").toArray().then((products) => {
                Promise.all(products.map(product => {
                    this.context.Products.attach(product);
                    (<any>product).Sync = now;
                    let proxyProduct = new Northwind.Product(product);
                    (<any>proxyProduct).Sync = undefined;
                    let proxyCategory = new Northwind.Category({ Id: product.Category.Id });
                    proxyProduct.Category = proxyCategory;
                    remoteContext.Categories.attach(proxyCategory, $data.EntityAttachMode.AllChanged);
                    return remoteContext.Products.single(`it.Id == ${product.Id}`).then((remoteProduct) => {
                        remoteContext.Products.attach(proxyProduct, $data.EntityAttachMode.AllChanged);
                    }, () => {
                        remoteContext.Products.add(proxyProduct);
                    });
                })).then(() => {
                    remoteContext.saveChanges().then(() => {
                        this.context.saveChanges().then(() => {
                            alert("Sync completed.");
                        });
                    });
                })
            });
        });
    }
}