import React from 'react';
import { StyleSheet, Text, View,TouchableOpacity,Image, TextInput, KeyboardAvoidingView,Alert, ToastAndroid } from 'react-native';
import * as Permissions from"expo-permissions";
import {BarCodeScanner} from "expo-barcode-scanner";
import db from "../config"
import firebase from "firebase";


export default class TransactionScreen extends React.Component{
constructor(){
    super();
    this.state={
        hasCameraPermissions:null,
        scanned:false,
       scannedBookId:"",
       scannedStudentId:"",
        buttonState:"normal",
        transactionMessage:""
    }
}
getCameraPermissions=async(id)=>{
    const {status}= await Permissions.askAsync(Permissions.CAMERA);
    this.setState({
        hasCameraPermissions:status==="granted",
        buttonState:id,
        scanned:false

 
        
    })
}


handleBarCodeScanned=async({type,data})=>{
    const{buttonState}= this.state

    if(buttonState==="BookId"){
        this.setState({
            scanned:true,
            scannedBookId:data,
            buttonState:"normal"
        })
    }
    else if(buttonState==="StudentId"){
        this.setState({
            scanned:true,
            scannedStudentId:data,
            buttonState:"normal"
        })
    }
}

initiateBookIssue=async()=>{
// add a transaction
db.collection("transaction").add({
    "studentId": this.state.scannedStudentId,
    "bookId": this.state.scannedBookId,
    "date": firebase.firestore.Timestamp.now().toDate(),
    "transactionType":"Issue"
})

//change book status
db.collection("books").doc(this.state.scannedBookId).update({
    "bookAvailability":false
})

// change the no. of books issued
db.collection("students").doc(this.state.scannedStudentId).update({
    "numberOfBooksIssued":firebase.firestore.FieldValue.increment(1)
})

this.setState({
    scannedBookId:"",
    scannedStudentId:""
})

}

initiateBookReturn=async()=>{
    // add a transaction
    db.collection("transaction").add({
        "studentId": this.state.scannedStudentId,
        "bookId": this.state.scannedBookId,
        "date": firebase.firestore.Timestamp.now().toDate(),
        "transactionType":"Return"
    })
    
    //change book status
    db.collection("books").doc(this.state.scannedBookId).update({
        "bookAvailability":true
    })
    
    // change the no. of books issued
    db.collection("students").doc(this.state.scannedStudentId).update({
        "numberOfBooksIssued":firebase.firestore.FieldValue.increment(-1)
    })
    
    this.setState({
        scannedBookId:"",
        scannedStudentId:""
    })
    
    }


handleTransaction=async()=>{
    var transactionType= await this.checkBookEligibility()// can return false/ issue/return

    console.log("TransactionType",transactionType)

    if(!transactionType)
    {
        alert("The Book doesn't exist in the database");
        this.setState({
            scannedBookId:"" ,
            scannedStudentId:""
        })
    }

    else if(transactionType === "Issue"){
        var isStudentEligible = await this.checkStudentEligibilityForBookIssue()// can return false/true/false
        if(isStudentEligible){
                this.initiateBookIssue()
                alert("Book issued to the student")
        }
    }

    else{
        var isStudentEligible=await this.checkStudentEligibilityForBookReturn()// can return true/false
        if(isStudentEligible){
            this.initiateBookReturn();
            alert("Book returned to the library");
        }
    }
}

checkBookEligibility= async()=>{
    const bookRef= await db.collection("books").where("bookId","==",this.state.scannedBookId).get()
    var transactionType=" "

    if(bookRef.docs.length===0){
        transactionType=false

        console.log(bookRef.docs.length)
    }

    else{
        bookRef.docs.map(doc=>{
            var book= doc.data()

            console.log(book)

            if(book.bookAvailability){
                transactionType= "Issue" 
            }

            else{
                transactionType="Return"
            }
        })
    }

    return transactionType
}

checkStudentEligibilityForBookIssue= async()=>{
    const studentRef= await db.collection("students").where("studentId","==",this.state.scannedStudentId).get()
    var isStudentEligible=" "

    if(studentRef.docs.length===0){
      this.setState({
          scannedStudentId:"",
          scannedBookId:""
      })  
      isStudentEligible=false
      alert(" The Student Id doesn't exist in the database")
    }
    else{
        studentRef.docs.map(doc=>{
            var student= doc.data()
            console.log(student)

            if(student.numberOfBooksIssued<2){
                isStudentEligible=true
            }
            else{
                isStudentEligible= false
                alert("The student has already issued 2 books")
           
                this.setState({
                    scannedBookId:"",
                    scannedStudentId:""
                })
            }
        })
    
    }

    return isStudentEligible// can return false/true/false 
}
  
checkStudentEligibilityForBookReturn=async()=>{
    const transactionRef=await db.collection("transaction").where("bookId","==",this.state.scannedBookId).limit(1).get()
    var isStudentEligible=""
    transactionRef.docs.map(doc=>{
        var lastBookTranaction=doc.data();
        console.log(lastBookTranaction)
        if(lastBookTranaction.studentId === this.state.scannedStudentId){
            isStudentEligible= true
        }
        else{
            isStudentEligible= false
            alert("The book wasn't issued by this student")

            this.setState({
                scannedBookId:"",
                scannedStudentId:""
            })
        }
    })
    return isStudentEligible
}

    render(){
        const hasCameraPermissions= this.state.hasCameraPermissions;
        const scanned= this.state.scanned;
        const buttonState=this.state.buttonState;

        if(buttonState!=="normal" && hasCameraPermissions){
            return(
                <BarCodeScanner
                onBarCodeScanned={scanned? undefined:this.handleBarCodeScanned}
                style={StyleSheet.absoluteFillObject}/>
            )
        }

        else if(buttonState==="normal"){

      
        return(
            <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
                <View>
                    <Image
                    source={require("../assets/booklogo.jpg")}
                    style={{width:200,height:200}}/>

                    <Text style={{textAlign:"center",fontSize:30}}> Wily</Text>

                </View>
               <View style={styles.inputView}>
                   <TextInput
                   style={styles.inputBox}
                   placeholder="Book Id"
                   onChangeText={(text) =>this.setState({scannedBookId:text})}
                   value={this.state.scannedBookId}/>
                   <TouchableOpacity
                    onPress={()=>{
                        this.getCameraPermissions("BookId")
                    }}

                   style={styles.scanButton}>
                       <Text style={styles.buttonText}>Scan</Text>
                   </TouchableOpacity>
               </View>
               <View style={styles.inputView}>
                   <TextInput
                   style={styles.inputBox}
                   placeholder="Student Id"
                   onChangeText ={(text) => this.setState({scannedStudentId:text})}
                   value={this.state.scannedStudentId}/>
                   <TouchableOpacity
                        onPress={()=>{
                            this.getCameraPermissions("StudentId")
                        }}
    

                   style={styles.scanButton}>
                       <Text style={styles.buttonText}>Scan</Text>
                   </TouchableOpacity>
               </View>

               <TouchableOpacity
               onPress={async()=>{this.handleTransaction()
                 
            }}
               style={styles.submitButton}>
               <Text style={styles.submitButtonText}>Submit</Text>
               </TouchableOpacity>
               </KeyboardAvoidingView>

        )
    }
}
}

const styles= StyleSheet.create({
    container:
    {
        flex:1,
        justifyContent:"center",
        alignItems:"center"
    }, 
    displayText:{
        fontSize:39,
        textDecorationLine:'underline'

    },
    scanButton:{
        backgroundColor:"#2196F3",
        width:50,
        borderLeftWidth:0,
        borderWidth:1.5
    },
    buttonText:{
        fontSize:15,
        textAlign:"center",
        marginTop:10
    },
    inputBox:{
        width:200,
        height:40,
        borderWidth:1.5,
        borderRightWidth:0,
        fontSize:20
    },
    inputView:{
        flexDirection:"row",
        margin:20
    },
    submitButtonText:{
        padding:10,
        textAlign:"center",
        fontSize:20,
        fontWeight:"bold",
        color:"black"
    },
    submitButton:{
        backgroundColor:"red",
        width:100,
        height:50

    }
})