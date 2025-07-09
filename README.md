# Node.js Media Server

This project is a lightweight microservice Node.js-based web application built using Express. It serves as a backend for hosting and delivering media files (images and videos) through clean, REST-style endpoints.

The application was developed as a hands-on learning project to deepen understanding of JavaScript, Node.js, System Design, Architecture Patterns, and the inner workings of a web application, including how servers handle file routing, static content delivery, and request/response cycles. It offered a practical way to understand core Node.js principles and Express middleware structure.

---

## Setup MongoDB

To set up a local MongoDB standalone server, follow these steps:

1. Install **MongoDB** on your machine following the instructions for your operating system.

2. **Start the MongoDB server** (`mongod`), which by default listens on `localhost:27017` and uses `/data/db` as the data directory (create this folder if it doesn't exist).

3. With the server running, connect to it using the Mongo shell or your application.

4. MongoDB automatically creates a database when you first reference it and insert data. To create a database named `<db_name>`, run the following in the Mongo shell:

    ```bash
    use <db_name>
    db.collection.insertOne({ example: "data" })
    ```

5. In your application, connect using the URI:

    ```js
    mongodb://localhost:27017/<db_name>
    ```

6. Add this URI connection string to all three `app.js` files and replace all instances of `<db_name>` with your actual database name.

---

## Setup Directories to Store Media

To organize media assets effectively, the application uses separate folders based on media type and access restrictions. Please create the following directories within your project’s media storage location:

```bash
restricted_image_media_directory        # Contains images with restricted access; may require authentication or special permissions
unrestricted_image_media_directory      # Contains images publicly accessible without restrictions
restricted_video_media_directory        # Contains videos with restricted access, protected similarly to restricted images
unrestricted_video_media_directory      # Contains videos accessible publicly without authentication
```
## Update the Codebase for local development
- Please update all occurrences of 0.0.0.0 throughout the codebase to reflect your local IP address. Execute the `get_local_ip` script if you're on macOS.
- In __ui-frontend/app.js__, update the path to your media storage directory (**Line 183**).
- In __docker-compose.yaml__, update the path to your media storage directory at (**Line 13**) and your mongo storage directory(**Line 53**).

## Start the Application:
You can immediately start the services by executing the __./script/run.sh__ script.

## Docker Compose
### Build the Image
```bash
    docker build -t ui-server:latest -f ./ui_Dockerfile .
    docker build -t model-server:latest -f ./model_Dockerfile .
    docker build -t media-server:latest -f ./media_Dockerfile .
```
```bash
    docker compose up -d
```
Access the site at: 
```arduino 
http:localhost:3000
```
## Main Page
<img width="1710" alt="Screenshot 2025-07-09 at 12 55 33 AM" src="https://github.com/user-attachments/assets/c4152fc4-7bfc-4dc5-aa14-c624df516b58" />

## Model Page
<img width="1709" alt="Screenshot 2025-07-09 at 12 51 17 AM" src="https://github.com/user-attachments/assets/ae574bbf-a095-4c7e-b546-25c9f7526570" />

## Nav Bar
<img width="249" alt="Screenshot 2025-07-09 at 12 52 25 AM" src="https://github.com/user-attachments/assets/b7511f85-d617-4476-8e24-69be66df208b" />
