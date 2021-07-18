import express, { response } from "express";
import bp from "body-parser";
import mongoose from "mongoose"
import _ from "lodash"

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}

const app = express()

app.set('view engine', 'ejs');

app.use(bp.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://priyanshu:Mwgszg5jAmANM8DM@cluster0.uldzr.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

//DataBase Schema and model
const itemSchema = {
    name : String
};
const Item = mongoose.model("item",itemSchema);

const item1 = new Item({name : "Welcome to your todolist"});
const item2 = new Item({name : "Hit the + button to add a new item."});
const item3 = new Item({name : "<-- Hit this checkbox to delete an item"});

const defaultItems = [item1,item2,item3];

const listSchema = {
    name : String,
    items : [itemSchema]
};
const List = mongoose.model("List",listSchema);

app.get("/", function (req, res) {
    
    Item.find({},(err,result) =>{
        if(result.length === 0 ){
            Item.insertMany(defaultItems, (err) => {
                if(err){
                    console.log(err);
                }else{
                    console.log("inserted default items");
                }
            });
            res.redirect("/");
        }
        if(err){
            console.log(err);
        }else{
            res.render('list', { listTitle: "Today", newListItem: result });
        }
    });
});

app.get("/about", (req, res) => {
    res.render('about');
})

app.get("/:customListName", (req, res) => {

    const routeName = _.capitalize(req.params.customListName);
    List.findOne({name : routeName}, (err,foundList)=>{
        if(!err){
            if(!foundList){
                //list not found so we create a new list
                const list = new List ({
                    name : routeName,
                    items : defaultItems
                });
                list.save();
                res.redirect("/"+routeName);
            }
            else{
                //show the existing list 
                res.render('list', { 
                    listTitle: foundList.name, newListItem: foundList.items 
                });
            }
        }
    });

});

app.post("/", (req, res) => {

    const itemName = req.body.item;
    const item = new Item ({
        name : itemName
    }); 
    
    const listName = (req.body.list).trim();
    if(listName === "Today"){
        item.save();
        res.redirect("/");
    }else{
        List.findOne({name : listName}, (err,foundList)=>{
            if(!err){
                foundList.items.push(item);
                foundList.save();
                res.redirect("/"+listName);
            }else{
                console.log(err);
            }
        });
    }
});


app.post("/delete", (req,res) => {

    const id = (req.body.checkbox).trim();
    const listName = req.body.listName[0];
    if(listName === "Today"){
        Item.findOneAndDelete({_id : id}, (err) => {
            if(!err){
                res.redirect("/");
            }else{
                console.log(err);
            }
        });
    }else{
        //$pull is a mongoDB operator
        List.findOneAndDelete(
            {name : listName},
            {$pull : {items : {_id : id}}},
            (err,foundList)=>{
                if(!err){
                    res.redirect("/"+listName);
                }else{
                    console.log(err);
                }
            } 

        )
    }

})


app.listen(port, function () {
    console.log("server started at  port : " + port);
});