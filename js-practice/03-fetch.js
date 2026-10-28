async function loadUsers(){
    let loading = true;
    let error = null;
    let data=[];
    console.log("Loading...");
    try{
        const res = await fetch("https://jsonplaceholder.typicode.com/users");
        if(!res.ok)throw new Error('Request failed:${res.status}');
        data = await res.json();
    }catch (err){
        error = err.message;
    }finally{
        loading = false;
    }
    if(error)console.log("Error:",error);
    else console.log("Loaded",data.length,"users.First:",data[0]?.name);
    console.log("loading=",loading);
}
loadUsers();