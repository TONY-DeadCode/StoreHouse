"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BsSearch } from "react-icons/bs";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@radix-ui/react-label";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

export default function Home() {
  interface Product {
    category: string;
    id: string;
    name: string;
    amount: number;
    photo: string | null;
  }

  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState(0);
  const [input, setInput] = useState<number>(0);
  const [photo, setPhoto] = useState<File | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const { toast } = useToast();

  // Fetch all products (Read)
  const fetchProducts = async (query?: string) => {
    const response = await fetch(`/api${query ? `?name=${query}` : ""}`);
    const data = await response.json();
    setProducts(data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Create a new product
  const handleCreate = async () => {
    const formData = new FormData();
    formData.append("name", selectedProductId as string);
    formData.append("category", category);
    formData.append("amount", String(amount));
    if (photo) formData.append("photo", photo);

    const response = await fetch("/api", {
      method: "POST",
      body: formData,
    });
    if (response.ok) {
      const newProduct = await response.json();
      setProducts([...products, newProduct]);
      toast({
        description: "Product created successfully.",
      });
    } else {
      console.error("Failed to create product");
    }
  };

  // Update a product's amount
  const handleUpdate = async (id: string, amount: number) => {
    const response = await fetch(`/api?id=${id}&amount=${amount}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const updatedProduct = await response.json();
      setProducts(
        products.map((product) =>
          product.id === id
            ? { ...product, amount: updatedProduct.amount }
            : product
        )
      );
      toast({
        description: "Product updated successfully.",
      });
    } else {
      console.error("Failed to update product");
    }
  };

  // Delete a product
  const handleDelete = async (id: string) => {
    const response = await fetch(`/api?id=${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      setProducts(products.filter((product) => product.id !== id));
      toast({
        description: "Product deleted successfully.",
      });
    } else {
      console.error("Failed to delete product");
    }
  };

  // Handle search
// Handle search
const handleSearch = (q?: string) => {
  // If there's no query and the name input is empty, fetch all products
  if (!q) {
    fetchProducts();
  } else {
    // Fetch products with the search query or name
    fetchProducts(q);
  }
};


  return (
    <main className="flex min-h-screen flex-col items-center p-5">
      <header className="w-96">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => {
              let vlaue = e.target.value;
              setName(vlaue);
              handleSearch(vlaue);
            }}
          />
          <Button type="submit" onClick={() => handleSearch()}>
            <BsSearch />
          </Button>
        </div>
      </header>
      <div className="flex justify-between items-center w-full mt-4">
        <p className="text-4xl">Products</p>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant={"outline"}>Create</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Product</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  className="col-span-3"
                  onChange={(e) => setSelectedProductId(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 py-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  type="text"
                  className="col-span-3"
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 py-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="amount">Stock</Label>
                <Input
                  id="amount"
                  type="number"
                  className="col-span-3"
                  onChange={(e) => setAmount(+e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 py-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="picture">Picture</Label>
                <Input
                  id="picture"
                  type="file"
                  onChange={(e) =>
                    setPhoto(e.target.files ? e.target.files[0] : null)
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreate}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-wrap justify-between space-y-4 space-x-4 p-7">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <Image
                src={"/uploads/" + product.photo}
                alt="Product"
                width={200}
                height={200}
              />
            </CardHeader>
            <CardContent>
              <div>Name: {product.name}</div>
              <div>Category: {product.category}</div>
              <div>Amount: {product.amount}</div>
            </CardContent>
            <CardFooter className="space-x-2">
              <Button
                type="button"
                onClick={() => handleUpdate(product.id, -1)}
              >
                -1
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Add</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add Stock</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="input">Stock</Label>
                      <Input
                        id="input"
                        type="number"
                        className="col-span-3"
                        value={input}
                        onChange={(e) => setInput(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      onClick={() => handleUpdate(product.id, input)}
                    >
                      Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button type="button" onClick={() => handleDelete(product.id)}>
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  );
}
