import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { Product } from "@/types/Product";
import multer from "multer";

const dataFilePath = path.join(process.cwd(), "./src/data", "products.json");

// Helper function to read data from JSON file
const readData = (): Product[] => {
  const fileContent = fs.readFileSync(dataFilePath, "utf8");
  return JSON.parse(fileContent) as Product[];
};

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: function (
    req: any,
    file: any,
    cb: (arg0: null, arg1: string) => void
  ) {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Middleware to handle `multer` within Next.js API route
export const config = {
  api: {
    bodyParser: false, // Disable Next.js body parsing to let multer handle it
  },
};

// Wrapper function to handle multer middleware
const runMiddleware = (req: NextApiRequest, res: NextApiResponse, fn: any) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

// Helper function to write data to JSON file
const writeData = (data: Product[]): void => {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case "POST": {
      // Run multer middleware
      await runMiddleware(req, res, upload.single("photo"));

      // Access uploaded file
      const file = (req as any).file;

      // Access other fields in the request
      const { name, category, amount } = req.body;
      // Read existing products data
      const products = readData();
      if (products[name]) {
        res.status(405).send("name is already exist");
        return;
      }

      // Create a new product
      const newProduct = {
        id: Date.now().toString(),
        name,
        category,
        amount: parseInt(amount, 10),
        photo: file ? `${file.filename}` : null, // Save the photo path if uploaded
      };

      // Add the new product to the existing products
      products.push(newProduct);

      // Write the updated products data back to the file
      writeData(products);

      // Send response
      res.status(201).json(newProduct);
    }

    case "GET": {
      const products = readData();
      const { name } = req.query;
      if (name) {
        const filteredProducts = products.filter(
          (product) => product.name.includes(name as string)
        );
        res.status(200).json(filteredProducts); // Send the response
      } else {
        res.status(200).json(products); // Send the response
      }
      break;
    }

    case "PATCH": {
      const { id, amount } = req.query;
      if (typeof id !== "string") {
        res.status(400).json({ error: "Invalid input" }); // Send the error response
        break;
      }

      const products = readData();
      const productIndex = products.findIndex((product) => product.id === id);
      if (productIndex === -1) {
        res.status(404).json({ error: "Product not found" }); // Send the error response
        break;
      }

      products[productIndex].amount += +(amount as string);
      writeData(products);

      res.status(200).json(products[productIndex]); // Send the response
      break;
    }

    case "DELETE": {
      const { id } = req.query;
      if (typeof id !== "string") {
        res.status(400).json({ error: "Invalid input" }); // Send the error response
        break;
      }

      let products = readData();
      let product = products.find((product) => product.id !== id);
      products = products.filter((product) => product.id !== id);
      if (product?.photo) {
        let photoPath = path.join(
          process.cwd(),
          "public",
          "uploads",
          product?.photo as string
        );
        fs.rmSync(photoPath);
      }
      writeData(products);
      res.status(204).end(); // Send the response without returning anything
      break;
    }

    default: {
      res.setHeader("Allow", ["POST", "GET", "PATCH", "DELETE"]);
      res.status(405).end(`Method ${req.method} Not Allowed`); // Send the response without returning anything
      break;
    }
  }
}
