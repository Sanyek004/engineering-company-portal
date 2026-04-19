import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Product = () => {
 const [product, setProduct] = useState(null);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState(null);
 const [number, setNumber] = useState('1');

 const handleNumberChange = (e) => {
    setNumber(e.target.value);
  };

 useEffect(() => {
   const fetchProduct = async () => {
     try {
       const response = await axios.get(`https://jsonplaceholder.typicode.com/users/${number}`);
       setProduct(response.data);
     } catch (error) {
       setError('Такого товара нет');
     } finally {
       setIsLoading(false);
     }
   };
   fetchProduct();
 }, [number]);

 if (isLoading) {
   return <p>Товар грузится</p>;
 }

 if (error) {
   return (
     <div>
       <p>{error}</p>
     </div>
   );
 }

 return (
    <div>
    {product && (
   <div>
    {/* <input type="text" value={number} onChange={handleNumberChange} /> */}
    
     <h2>{product.name}</h2>
     <p>{product.description}</p>   
   </div>
   )}
   </div>
 );
};

export default Product;
