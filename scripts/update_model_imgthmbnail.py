from pymongo import MongoClient

# MongoDB connection URI
uri = "mongodb://localhost:27017/<db_name>"

# Connect to the MongoDB server
client = MongoClient(uri)

# Select the database and collection
db = client['<db_name>']
collection = db['models']

# MongoDB updateMany command
update_command = [
    {
        "$set": {
            "imageThumbnail": {
                "$arrayElemAt": [
                    {
                        "$filter": {
                            "input": "$images",
                            "as": "img",
                            "cond": { "$ne": ["$$img.fileType", "gif"] }
                        }
                    },
                    0
                ]
            }
        }
    }
]

# Run the updateMany command
result = collection.update_many(
    { "images.fileType": { "$ne": "gif" } },  # Filter documents with at least one image with fileType not "gif"
    update_command
)

# Output the result
print(f"Matched {result.matched_count} documents and modified {result.modified_count} documents.")

# Close the MongoDB connection
client.close()