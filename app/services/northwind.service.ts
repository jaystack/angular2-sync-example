import { Injectable } from '@angular/core';
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import { System, factory, Northwind } from '../../jaydata-model/Northwind';
import "jaydata/odata";

@Injectable( )
export class NorthwindService
{
    private localContext: System.Data.Objects.NorthwindContext;
    private remoteContext: System.Data.Objects.NorthwindContext;
    private localSubject: Subject<System.Data.Objects.NorthwindContext>;
    private remoteSubject: Subject<System.Data.Objects.NorthwindContext>;

    constructor( )
    {
        this.localSubject = new Subject( );
        this.remoteSubject = new Subject( );

        Northwind.Category.addMember("Sync", { type: "int", nullable: false });
        Northwind.Product.addMember("Sync", { type: "int", nullable: false });

        factory({
            name: 'local'
        })
        .onReady()
        .then( context => this.onLocalReady( context ) );

        factory()
        .onReady()
        .then( context => this.onRemoteReady( context ) );
    }

    getContext( setContext:( context: System.Data.Objects.NorthwindContext )=>void )
    {
        if( this.localContext )
        {
            setContext( this.localContext );
        }
        else
        {
            this.localSubject.subscribe( setContext );
        }
    }

    getRemoteContext( setContext:( context: System.Data.Objects.NorthwindContext )=>void )
    {
        if( this.remoteContext )
        {
            setContext( this.remoteContext );
        }
        else
        {
            this.remoteSubject.subscribe( setContext );
        }
    }

    private onLocalReady( context: System.Data.Objects.NorthwindContext )
    {
        this.localContext = context;
        this.localSubject.next( this.localContext );
        this.localSubject.complete( );
    }

    private onRemoteReady( context: System.Data.Objects.NorthwindContext )
    {
        this.remoteContext = context;
        this.remoteSubject.next( this.remoteContext );
        this.remoteSubject.complete( );
    }
}