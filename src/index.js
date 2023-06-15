const express = require("express")
const { v4: uuidv4 } = require('uuid')  

const app = express()

app.use(express.json())

//array para armazenar nossos dados pq ainda não temos BANCO DE DADOS
const customers = []

//funcção para vecificar o cpf
function verifyIfAccountCpf(req, res, next) {
  const { cpf } = req.headers;

  const customer = customers.find(customer => customer.cpf === cpf);

  if (!customer) {
    return res.status(400).json({ message: 'customer not found!' })
  }

  req.customer = customer

  next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0)
  return balance;
}
// método post cria as coisas e tbm é mais comum passar comandos
app.post('/account', (req, res) => {
  const { cpf, name } = req.body

  //validação para verificar todos o CPFs do array para não deixar criar mais de um CPF com o mesmo nome
  const custumersAlreadyExists = customers.some(
    customer => customer.cpf === cpf
  )
  if (custumersAlreadyExists) {
    return res.status(400).json({
      message: "Customers Already Exists!"
    })
  }
  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: []
  })

  return res.status(400).json({
    message: "Customer creat!"
  })
})

//rerificando se esse CPF já existi
app.get('/account', verifyIfAccountCpf, (req, res) => {
  const { customer } = req;

  return res.json({
    message: 'Sucess',
    customer
  })
})
//somente para teste 


app.patch('/account', verifyIfAccountCpf, (req, res) => {
  const { customer } = req;
  const { name } = req.body;

  customer.name = name;

  return res.json({ message: 'Account updated' });
})

//deletar o item no array 
app.delete('/account', verifyIfAccountCpf, (req, res) => {
  const { customer } = req;
  customers.splice(customers.indexOf(customer.cpf), 1);

  return res.json({
    message: 'Account deleted',
    customers
  })
})


app.get('/statement', verifyIfAccountCpf, (req, res) => {
  const { customer } = req;

  return res.json({
    message: 'Extrato da conta',
    statement: customer.statement
  });

})

app.get('/statement/date', verifyIfAccountCpf, (req, res) => {
  const { customer } = req;
  const { date } = req.query;

  const dateFormat =  new Date(date + " 00:00");
  const statement = customer.statement.filter(
    (statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString()
  )

  return res.json(statement);
})

app.get('/statement', verifyIfAccountCpf, (req, res) => {
  const { customer } = req;
  
  return res.json({
    message: 'Sucess', 
    statement: customer.statement
  })
})

//rota de deposito
app.post('/deposit', verifyIfAccountCpf, (req, res) => {
  const { customer } = req;

  const { amount, description } = req.body;

  const statementOperation = {
    amount,
    description,
    createde_at: new Date(),
    type: 'credit'
  }
  customer.statement.push(statementOperation);

  return res.status(400).json({
    message: "Sucessfully deposited!"
  })

})


//rota de saque

app.post('/withdraw', verifyIfAccountCpf, (req, res) => {
  const { customer } = req;
  const { amount } = req.body;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return res.status(400).json({ message: 'Insuficient funds!' });
  }
  const statementOperation = {
    amount,
    createde_at: new Date(),
    type: 'debit'
  }

  customer.statement.push(statementOperation);

  return res.status(400).json({
    message: 'Sucessfully withdraw!'

  })

})


app.get('/balance', verifyIfAccountCpf, (req, res) => {

  const { customer } = req;
  const balance = getBalance(customer.statement);

  return res.json({ message: 'Success!', balance })


})




app.listen(3333) //numero da porta aberta para acessar 

