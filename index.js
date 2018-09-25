
const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp(functions.config().firebase);

//1 duplicar mensaje y agregarlo a los filters de privacidad
exports.addToUserPosts = functions.database.ref('/messages/{pushId}')
    .onWrite((change, context) => {
      // Grab the current value of what was written to the Realtime Database.
      const original = change.after.val();
      console.log("adding post ");



     const tipoAcceso = original.acceso;
     const postID = original.idMensaje;
     const userID = original.userId;

      //add post to user posts
      var userposts = admin.database().ref().child("user-posts/" + userID + "/" + tipoAcceso + "/" +  postID);

      return userposts.update(original);
    });



    //2 filter words on update

    exports.filterWords = functions.database.ref('/messages/{pushId}')
    .onUpdate((change, context) => {
      // Grab the current value of what was written to the Realtime Database.
      //const original = change.after.val();
      console.log("filtering post ");

      const before = change.before.val();
      const after = change.after.val();

      if(before.mensaje === after.mensaje ){
        if(before.titulo !== after.titulo){
          console.log("titulo changed");
        }else{
          console.log("title didn't change");
          return null;
        }
      }
      

      if(before.titulo === after.titulo ){
        if(before.mensaje !== after.mensaje){
          console.log("message changed");
        }else{
          console.log("message didn't change");
          return null;
        }
      }

      let titulo = after.titulo;

      let mensaje = after.mensaje;
      console.log("mensaje original: " + mensaje);
      let unnecessaryWords = ['shit', 'shitty', 'ass', 'damn', 'fuck', 'fucking' , 'bitch',  'crap', 'bullshit'];

      let messageWords = mensaje.split(' ');
      let tituloWords = titulo.split(' ');

      let filteredWords = messageWords.filter(mw => !unnecessaryWords.includes(mw.toLowerCase()));
      let filteredTitulo = tituloWords.filter(tw => !unnecessaryWords.includes(tw.toLowerCase()));

      let resultMessage = filteredWords.join(' ');
      let resultTitulo = filteredTitulo.join(' ');

      //console.log("result string: " + resultMessage);
      
      return change.after.ref.update({mensaje : resultMessage, titulo : resultTitulo});
    });

    //3. filter words on create

    exports.filterWordsOnCreate = functions.database.ref('/messages/{pushId}')
    .onCreate((snapshot, context) => {
      // Grab the current value of what was written to the Realtime Database.
      //const original = change.after.val();
      console.log("filtering post ");


    let titulo = snapshot.val().titulo;

    let mensaje = snapshot.val().mensaje;
    console.log("mensaje original: " + mensaje);
    let unnecessaryWords = ['shit', 'shitty', 'ass', 'damn', 'fuck', 'fucking' , 'bitch',  'crap', 'bullshit'];

    let messageWords = mensaje.split(' ');
    let tituloWords = titulo.split(' ');

    let filteredWords = messageWords.filter(mw => !unnecessaryWords.includes(mw.toLowerCase()));
    let filteredTitulo = tituloWords.filter(tw => !unnecessaryWords.includes(tw.toLowerCase()));

    let resultMessage = filteredWords.join(' ');
    let resultTitulo = filteredTitulo.join(' ');

    //console.log("result string: " + resultMessage);
    
    return snapshot.ref.update({mensaje : resultMessage, titulo : resultTitulo});
  });


//4. change likes count
    exports.countlikechange = functions.database.ref('/messages/{postid}/likes/userIDs/{likeid}').onWrite(
        change => {
          const myLikeRef = change.after.ref.parent;
          const countRef = myLikeRef.parent.child('cont');
    

          let add = (change.after.exists() && !change.before.exists()) ? 
            1 : (!change.after.exists() && change.before.exists()) ? 
                -1 : null;

          return countRef.transaction((current) => {
            return (current || 0) + add;
          });
          console.log('Counter updated.');
          return null;
        });



        //5. recount likes
        exports.recountlikes = functions.database.ref('/messages/{postid}/likes/cont').onDelete(snap => {
            const counterRef = snap.ref;
            //parent = likes, child = userIDs
            /*
            /likes  <--- counterRef.parent
                cont  <---counterRef
                /userIDs <--- likeRef
                    /id1
                    /id2
                    /etc
            */
            const likeRef = counterRef.parent.child('userIDs');

 
            likeRef.once("value").then(snapshot => {
              return counterRef.update(snapshot.numChildren());
            });
          });

/*
          exports.countPostTypeLikeChange = functions.database.ref('/user-posts/{postid}/{typeMessage}/{messageID}/likes/userIDs/{likeid}').onWrite(
            change => {
              const myLikeRef = change.after.ref.parent;
              const countRef = myLikeRef.parent.child('cont');
        
    
              let add = (change.after.exists() && !change.before.exists()) ? 
                1 : (!change.after.exists() && change.before.exists()) ? 
                    -1 : null;
    
              return countRef.transaction((current) => {
                return (current || 0) + add;
              });
              //console.log('Counter updated.');
              return null;
            });
    
    */