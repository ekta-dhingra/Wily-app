import React from 'react';
import { StyleSheet, Text, View,TextInput, TouchableOpacity,FlatList } from 'react-native';
import db from "../config"

export default class SearchScreen extends React.Component{

    constructor(){
        super()
        this.state={
            search:"",
            allTransaction:[],
            lastVisibleTransaction:null
        }
    }


    searchTransactions=async(text)=>{
       
        var text=text.toUpperCase()
         var enteredText= text.split("")

        if(enteredText[0].toUpperCase()==="B"){
            const transaction= await db.collection("transaction").where("bookId","==",text).limit(10).get()

            transaction.docs.map((doc)=>{
                this.setState({
                    allTransaction:[...this.state.allTransaction,doc.data()],
                    lastVisibleTransaction:doc
                })
            })
        }


        else if(enteredText[0].toUpperCase()==="S"){
            const transaction= await db.collection("transaction").where("studentId","==",text).limit(10).get()

            transaction.docs.map((doc)=>{
                this.setState({
                    allTransaction:[...this.state.allTransaction,doc.data()],
                    lastVisibleTransaction:doc
                })
            })
        }
        console.log("fetch", this.state.allTransaction.length)
    }

    fetchMoreTransactions=async()=>{
        var text=this.state.search.toUpperCase()
        var enteredText= text.split("")
       

        if(enteredText[0].toUpperCase()==="B"){
            const transaction= await db.collection("transaction").where("bookId","==",text).startAfter(this.state.lastVisibleTransaction).limit(10).get()

            transaction.docs.map((doc)=>{
                this.setState({
                    allTransaction:[...this.state.allTransaction,doc.data()],
                    lastVisibleTransaction:doc
                })
            })
        }


        else if(enteredText[0].toUpperCase()==="S"){
            const transaction= await db.collection("transaction").where("studentId","==",text).startAfter(this.state.lastVisibleTransaction).limit(10).get()

            transaction.docs.map((doc)=>{
                this.setState({
                    allTransaction:[...this.state.allTransaction,doc.data()],
                    lastVisibleTransaction:doc
                })
            })
        }
    }
    render(){
        return(
            <View style={styles.container}>
               <View style={styles.searchBar}>
                   <TextInput
                   style={styles.bar}
                   placeholder="Enter Book Id or Student Id"
                   onChangeText={(text)=>{
                       this.setState({search:text})
                   }}/>
                   <TouchableOpacity
                   style={styles.searchButton}

                   onPress={()=> {this.searchTransactions(this.state.search)}}>
                   <Text> Search</Text>
                   </TouchableOpacity>
                   
                   
             </View>

             <FlatList
             data={this.state.allTransaction}
             
             renderItem={({item})=>(
                    <View style={{borderWidth:2}}>
                        <Text>{"BookId:" + item.bookId}</Text>
                        <Text>{"StudentId:" + item.studentId}</Text>
                        <Text>{"Transaction Type:" + item.transactionType}</Text>
                        <Text>{"Date:" + item.date.toDate()}</Text>
                     </View>
             )}
             keyExtractor={(item,index)=>index.toString()}


             onEndReached={this.fetchMoreTransactions}
             onEndReachedThreshold={0.9}
             />
            </View>
        )
    }
}



const styles= StyleSheet.create({
    container:{
        flex:1,
        marginTop:20
    },
    searchBar:{
        flexDirection:"row",
        height:40,
        width:"auto",
        borderWidth:0.5,
        alignItems:"center",
        backgroundColor:"white"
    },

    bar:{
        borderWidth:2,
        height:30,
        width:300,
        paddingLeft:10
    },
    searchButton:{
    borderWidth:1,
    height:30,
    width:50,
    alignItems:"center",
    justifyContent:"center",
    backgroundColor:"blue"
    }
})