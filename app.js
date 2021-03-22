const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//

// connects to local mongo db and creates the db named todolistDB
mongoose.set("useNewUrlParser", true);

mongoose.set("useUnifiedTopology", true);
mongoose
  .connect("mongodb://localhost:27017/todolistDB")
  .then(() => {
    console.log("Connection is opened!");
  })
  .catch((err) => {
    console.log("We have error!!");
    console.log(err);
  });

//
//
//==========================================First Model collection ==================================================
// Each schema maps to a MongoDB collection and defines the shape of the documents within that collection.
// this is the schema for the mongodb which defines that therre is one type of data items to be stored
// and they are strings
const itemsSchema = {
  name: String,
};
//Models are responsible for creating and reading documents from the underlying MongoDB database.
// the first parameter is the singular of items i.e. item, and 2nd parameter is the name of schema itself
const Item = mongoose.model("Item", itemsSchema);

//Mongoose documents below represent a one-to-one mapping to documents as stored in MongoDB. Each document
//is an instance of the Item Model.
const item1 = new Item({
  name: "Welcome to your note taking app!",
});
const item2 = new Item({
  name: "Hit the + button to add a new item",
});
const item3 = new Item({
  name: "<-- Hit this to delete an item",
});
const defaultItems = [item1, item2, item3];
//
//
//===========================================Second Model collection==============================================
//new schema and model
// for every new list we create, the list will have a name in string format, and will have an array of
// item documents associated with it
const listSchema = {
  name: String,
  items: [itemsSchema],
};
//
const List = mongoose.model("List", listSchema);
//
//================================================Home Route =======================================================
app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    // retrieves ALL items in the Item model and names them foundItems
    //console.log(foundItems);
    if (foundItems.length === 0) {
      // if the array is empty to begin with, then insert all the defaultitems
      Item.insertMany(defaultItems, function (err) {
        // inserting into Item the defaultItems
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved the default items to database");
        }
      });
      res.redirect("/"); // goes back home after inserting the defaultitems
    } else {
      // if array not empty, render onto the list.ejs the following
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

//
//
// ==========================this POST route is where every item submitted on submit button is handled================
app.post("/", function (req, res) {
  //console.log(req.body);
  const itemName = req.body.newItem; //newItem is name from input box tag in list.ejs, represents whatever the user types in the text box
  const listName = req.body.list; // the list is from the submit button name, on the home page
  const item = new Item({
    // creates new document and passes to it the value of itemName
    name: itemName,
  });
  if (listName === "Today") {
    // if user button presses submit from the home page i.e. the Today page
    item.save(); // save this new item into the collection of items
    res.redirect("/"); // upon  redirect, will basically refreshes the pages and shows the new item inserted onto this page
  } else {
    // if list from button press does not originate from home Today page i.e it came from a custom page instead
    List.findOne({ name: listName }, function (err, foundList) {
      // find the origin page, i.e custome page, from where the button is pressed
      foundList.items.push(item); // and pushes onto it the foundList items in this custom page whatever the user inputs and submits
      foundList.save(); // updates and saves the updated list with the new item the user inputted
      res.redirect("/" + listName); // redirects back i.e refreshes to custom list page where user inputted the new item
    });
  }
});
//
//
app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  Item.findByIdAndRemove(checkedItemId, function (err) {
    if (!err) {
      console.log("succesfully deleted this item");
      res.redirect("/"); // after deleting item, will refresh and go to home route and only show items not yet deleted
    }
  });
});
//
//
//=======================Custom Route where all user inputted items from custom page is handled and rendered=========================================================

app.get("/:customListName", function (req, res) {
  const customListName = req.params.customListName;
  List.findOne({ name: customListName }, function (err, foundList) {
    //checks to see if a list already exists with same name of whatever the user types in.  if yes, will call it foundList
    if (!err) {
      if (!foundList) {
        // if no error and no repeated list, will now create new list:
        const list = new List({
          name: customListName, // whatever the user types in the url
          items: defaultItems, // will render what is already on the defaultItems list
        });
        list.save();
        res.redirect("/" + customListName); // will redirect back to the url of whatever the user types in
      } else {
        // will render onto list.ejs the following info:
        res.render("list", {
          listTitle: foundList.name, // the name of whatever the user types in the url
          newListItems: foundList.items,
        });
      }
    }
  });
});
//
//
//===============================================About route =======================================================

app.get("/about", function (req, res) {
  res.render("about");
});
//

//===================================================================================================================

app.listen(8000, function () {
  console.log("server is running on port 8000");
});
