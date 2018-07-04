var tokenContractAddress = '0xb7818e8789f641dea6d8a320bafefd6a85cb35ec';
var crowdsaleContractAddress = '0x8412fd7417ed8b9237763cc2509183758d9b87a7';
var tokenContractAddressRopsten = '0xb4fddd37602b03fa086c42bfa7b9739be38682c3'; // For testing in Ropsten testnet only
var crowdsaleContractAddressRopsten = '0x382b3d898ccfa4ae5cb7375491bb771107e21b61'; // For testing in Ropsten testnet only

var netId;
var web3js;
var userAccount = false;

var CubikToken;
var CubikCrowdsale;

// Checking if Web3 has been injected by the browser (Mist/MetaMask)
window.addEventListener('load', function () {
    if (typeof web3 !== 'undefined') {
        // Use Mist/MetaMask's provider
        web3js = new Web3(web3.currentProvider);
        // Debug only: override web3js
//        web3js = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Local-node, use Geth or testrpc to start one
//        web3js = new Web3(new Web3.providers.HttpProvider('https://api.myetherapi.com/eth')); // Mainnet node
//        web3js = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/93Pkd62SaFUrBJZC646A')); // Mainnet node 2
//        web3js = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/93Pkd62SaFUrBJZC646A")); // Ropsten testnet node
        startApp();
    } else {
        toggleMetaMaskPrompt(true);
    }
});

$('#buy-amount').change(function () {
    var totalEth = (this.value * 0.0002).toFixed(4);
    totalEth = parseFloat(totalEth);
    $('#total-eth').show().text(totalEth + ' ETH');
});

$('#buy-amount').keyup(function () {
    var totalEth = (this.value * 0.0002).toFixed(4);
    totalEth = parseFloat(totalEth);
    $('#total-eth').show().text(totalEth + ' ETH');
});

$('#buy-button').click(function (event) {
    event.preventDefault();
    $("#transaction-status").show().text("Transaction submitted, please confirm in MetaMask.");
    var eth = parseInt($('#buy-amount').val()) / 5000;
    web3js.eth.sendTransaction({
        from: userAccount,
        value: web3js.utils.toWei(eth.toFixed(4), "ether"),
        to: crowdsaleContractAddress
    })
    .once('transactionHash', function (hash) {
        $("#transaction-status").html("Your contribution is being processed... <br />Transaction Hash: " + getTransactionUrl(hash));
    })
    .once('receipt', function(receipt){
//        console.log(receipt);
        $('#transaction-status').html("Congrates! Your contribution has been processed and you received new CUBIKs!");
    })
//    .on('confirmation', function(confNumber, receipt){ console.log("confirmation"); console.log(confNumber); console.log(receipt); })
    .on('error', function (error) {
        $("#transaction-status").html("There was an error processing your contribution.<br />" + String(error));
    });

//    
//    crowdsale.send({from: userAccount, value: web3js.utils.toWei($('#buy-amount').val(), "ether")})
//            .on("receipt", function (receipt) {
//                $("#transaction-status").text("Purchased succeed!");
//                getZombiesByOwner(userAccount).then(displayZombies);
//            })
//            .on("error", function (error) {
//                $("#transaction-status").text("Purchased succeed!");
//            });
});

function startApp() {
    // Check if in mainnet or testnets
    web3js.eth.net.getId().then(function (networkId) {
        netId = networkId;
        if (netId === 3) {
            tokenContractAddress = tokenContractAddressRopsten;
            crowdsaleContractAddress = crowdsaleContractAddressRopsten;
            $('#testnet-warning').show().html("This is a Ropsten <b>Testnet</b> Transaction Only. Change to mainnet for valid contribution.");
        } else if (netId !== 1) {
            $('#testnet-warning').show().html("You're not connected! Open MetaMask and make sure you are on the Main Ethereum Network.");
        }

        // Get hold of contract instance
        CubikToken = new web3js.eth.Contract(tokenAbi, tokenContractAddress);
        CubikCrowdsale = new web3js.eth.Contract(crowdsaleAbi, crowdsaleContractAddress);

        // Update account detail every 3 seconds
        setInterval(checkAccountDetail, 3000);

        $('#test').click(function () {
            CubikToken.methods.approve('0x382b3d898ccfa4ae5cb7375491bb771107e21b61', 1).send({from: userAccount}).then(function (res) {
                console.log(res);
            });
        });
    });
    // listen for contribution in crowdsale contract
//    crowdsale.events.TokenPurchase({filter: {purchaser: userAccount}})
//    crowdsale.events.TokenPurchase()
//            .on('data', function (event) {
//                console.log(event);
//                let tokenPurchase = event.returnValues;
//                $('#transaction-status').html("Congrates! Your contribution has been processed and You received " + (tokenPurchase.amount / 1e18) + " CUBIKs!");
//                updateAccountDetail();
//            })
//            .on('error', console.error);
}

function checkAccountDetail() {
    // Get default account
    web3js.eth.getAccounts().then(function (accounts) {
        // Just keep updating, so the user's balance is updated after purchase
//        if (accounts[0] !== userAccount) {
            userAccount = accounts[0];
            updateAccountDetail();
//        }
    });
}

function updateAccountDetail() {
    if (userAccount === undefined) {
        toggleMetaMaskPrompt(true);
    } else {
        toggleMetaMaskPrompt(false);
        getAccountDetail();
    }
}

function getAccountDetail() {
    // Address
    $('#address').text(userAccount);
    // Account balance in Ether
    web3js.eth.getBalance(userAccount).then(function (res) {
        var balance = web3js.utils.fromWei(res, 'ether');
        $('#eth-amount').text(balance);
    });
    // Token balance
    CubikToken.methods.balanceOf(userAccount).call().then(function (res) {
        $('#token-amount').text(web3js.utils.fromWei(res, 'ether'));
    });
}

function toggleMetaMaskPrompt(toggle) {
    $('#no-metamask').toggle(toggle);
    $('#account-detail').toggle(!toggle);
    $('#buy-button').prop('disabled', toggle);
}

function getTransactionUrl(address) {
    var url = netId === 3 ? "ropsten.etherscan.io" : "etherscan.io";
    return "<a href='https://" + url + "/tx/" + address + "' target='_blank'>" + address + "</a>";
}