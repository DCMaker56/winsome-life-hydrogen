/**
 * Product data hooks (Hydrogen).
 *
 * In Hydrogen we fetch data via Remix-style route loaders, then pass it
 * down via React Context. These hooks just consume that context.
 * For now they return empty arrays until the catalog provider is wired.
 */
import {createContext, useContext} from 'react';
import type {Product, Collection} from '~/lib/products';

interface CatalogContext {
  products: Product[];
  collections: Collection[];
}

const Ctx = createContext<CatalogContext>({products: [], collections: []});

export function CatalogProvider({
  products,
  collections,
  children,
}: CatalogContext & {children: React.ReactNode}) {
  return <Ctx.Provider value={{products, collections}}>{children}</Ctx.Provider>;
}

export function useAllProducts(limit?: number) {
  const {products} = useContext(Ctx);
  return {data: limit ? products.slice(0, limit) : products, isLoading: false};
}

export function useCollections() {
  const {collections} = useContext(Ctx);
  return {data: collections, isLoading: false};
}
