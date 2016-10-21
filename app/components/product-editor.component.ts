import { Component } from '@angular/core';
import { NorthwindService } from '../services';
import { System, Northwind, factory, type } from '../../jaydata-model/Northwind';
import { Subject } from "rxjs/Subject";

@Component({
    selector: 'product-editor',
    templateUrl: './templates/product-editor.template.html'
})
export class ProductEditorComponent {
    public onSaveSub: Subject<Northwind.Product>

    private context: System.Data.Objects.NorthwindContext
    private category: Northwind.Category
    private product: Northwind.Product
    private action: string = "create";
    private notifyText = "Please wait ...";
    private isChange = true;

    constructor(northwindService: NorthwindService) {
        this.onSaveSub = new Subject();

        northwindService.getContext(
            context => this.context = context
        );

        this.product = new Northwind.Product();
    }

    targetProduct(product: Northwind.Product) {
        this.isChange = true;
        this.product = product;
        this.action = "edit";
        this.context.Products.attach(this.product);
        this.notifyText = "Please wait ..."
    }

    add(category: Northwind.Category) {
        this.isChange = false;
        this.category = category;
        this.product = new Northwind.Product();
        this.product.Category = this.category;
        this.context.Categories.attach(this.category);
    }

    private OnSave(){
        (<any>this.product).Sync = -1;
        if (!this.isChange) {
            this.context.Products.add(this.product);
        }

        this.context.saveChanges()
            .then(
            () => this.notifyText = "Complete"
            )
            .catch(
            (error) => this.notifyText = "Error: " + error.name
            );

        this.context.stateManager.reset();
        this.onSaveSub.next(this.product);
    }
}