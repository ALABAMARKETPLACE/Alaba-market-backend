import { CartTable } from "./cart.entity";



export const CartProvider = [
{ provide: 'cartRepository', useValue: CartTable},
];