//jshint esversion:6

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/todolistDB', { useNewUrlParser: true });

const itemSchema = new Schema({
    item: String
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
    item: "Welcome to your todolist"
});

const item2 = new Item({
    item: "Enter and hit + button to add an entry."
});

const item3 = new Item({
    item: "Tick the checkbox to remove the entry."
});

const existingItem = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {
    const day = "Today";

    Item.find({}, (err, foundItems) => {

        if(foundItems.length === 0) {
            Item.insertMany(existingItem, function(err){
                if(err){
                   console.log(err);
               } else{
                    console.log('Default items sucessfully added');
                }
            });
           res.redirect("/");
        } else {
               res.render('lists', {listTitle: day, newListItems: foundItems});
        }

    });
});

app.get("/:listName", (req,res) => {

    const listName = _.capitalize(req.params.listName);

    List.findOne({name: listName}, (err, found) => {
        if(err){
            console.log(err);
        } else if(!found){
            const list = new List({
                name: listName,
                items: existingItem
            });
        
            list.save();
            console.log('Item added!');
            res.redirect("/" + listName);
        } else {
        res.render('lists', {listTitle: found.name, newListItems: found.items});
        }
    });

});

app.post("/", (req,res) => {
    const itemName = req.body.newItem;
    const routeType = req.body.list;

    const item = new Item({
        item: itemName
    });

    if(routeType === "Today"){
        item.save();
        res.redirect("/");
    }
    else{
        List.findOne({name: routeType}, (err, found) => {
            found.items.push(item);
            found.save();
            res.redirect("/" + routeType);
        });
    }
});

app.post("/delete", (req,res) => {
    const itemId = req.body.removeItem;
    const listName = req.body.listName;

    if(listName === "Today"){
    Item.findByIdAndRemove(itemId, (err) => {
        if(err){
            console.log(err);
        } else {
            console.log('Item was removed!');
            res.redirect("/");
        }

    });

    } else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemId}}}, (err, found) => {
            if(err){
                console.log(err);
            } else if(found){
                res.redirect("/" + listName);
            }
        });
    }

});

app.post("/deletelist", (req,res) => {
    const listName = req.body.delbtn;

    List.findOneAndDelete({name: listName}, (err) => {
        if(err){
            console.log(err);
        }
        else {
            res.redirect("/"); 
        }
    });
    
});

app.listen(3000, () => {
    console.log("server is working on port 3000");
});