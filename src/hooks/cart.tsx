import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): Promise<void>;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      try {
        await AsyncStorage.clear();
        const cart = await AsyncStorage.getItem('@gomarketplace:products');
        if (cart) setProducts(JSON.parse(cart));
      } catch (e) {
        console.error(
          `Can't retreive products information. Cause: ${e.message}`,
        );
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const productOnCart = products.find((p: Product) => p.id === product.id);

      if (productOnCart) {
        setProducts(
          products.map(p =>
            p.id === product.id ? { ...product, quantity: p.quantity + 1 } : p,
          ),
        );
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }

      await AsyncStorage.setItem(
        '@gomarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productsOnCart = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );
      setProducts(productsOnCart);

      await AsyncStorage.setItem(
        '@gomarketplace:products',
        JSON.stringify(productsOnCart),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productsOnCart = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity - 1 }
          : product,
      );
      setProducts(productsOnCart);

      await AsyncStorage.setItem(
        '@gomarketplace:products',
        JSON.stringify(productsOnCart),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
