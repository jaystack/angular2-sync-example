import { Component, Input, ElementRef, OnInit } from '@angular/core';
import { NorthwindService } from '../services';
import { Northwind, System } from '../../jaydata-model/Northwind';
import { ProductEditorComponent } from './product-editor.component'

@Component({
    selector: 'products',
    templateUrl: './templates/products.template.html'
})
export class ProductsComponent implements OnInit {
    @Input("category")
    private category: any;

    @Input("editor")
    private editor: ProductEditorComponent;

    private products = [];
    public isActive = false;

    constructor(private northwindService: NorthwindService) { }

    openToggle() {
        if (this.isActive) {
            this.isActive = false;
        }
        else {
            this.init();
        }
    }

    open() {
        this.init();
    }

    ngOnInit() {
        this.editor.onSaveSub.subscribe((product) => {
            if (product.Category.Id === this.category.Id){
                this.init();
                if (this.products.filter(it => it.Id == product.Id).length == 0){
                    this.products.push(product);
                }
            }
        }
        )
    }

    add() {
        this.editor.add(this.category);
    }

    private init() {
        this.northwindService.getContext(
            context => this.OnContextLoaded(context)
        );
    }

    private OnContextLoaded(context) {
        this.category.getProperty("Products").then((products) => {
            this.products = products;
            this.isActive = true;
        });
    }

    private OnClick(product: Northwind.Product) {
        product.Category = this.category;
        this.editor.targetProduct(product);
    }
}