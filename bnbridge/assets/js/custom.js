$(document).ready(function() {
  const apiURL = "http://localhost:8000/api/v1/"
  let tokens = []

  var callAPI = function(type, url, data, calllback) {
    $.ajax({
      url: url,
      type: type,
      data: JSON.stringify(data),
      dataType: 'json',
      headers: {
        'Authorization':'Basic ZTgwMTY1NjkzZjAyOTk1N2VjNDQ4MjBhNGRiODJiMGI1NjI5YjM2YjJkNjc1YjVhYjE0YmEwNTBhMDFiNDk3ZDpmYmM3MWMyOTRmOWE4N2VlM2QzMmVkZDVkNjExNTE4MTFlNDRmNzc0NDgzNzY4OWVmYWRkYmJiOWY3NjgxYzA5',
        'Content-Type':'application/json'
      },
      success: (result) => { calllback(null, result ) },
      error: (error) => { calllback(error) },
    })
  }

  var getSupportedTokens = () => {
    callAPI('GET', apiURL+'tokens', null, (err, data) => {
      if(err) {
        console.log(err)
        return
      }

      if(data.status == 200) {
        tokens = data.result
        $.each(data.result, function(k, v) {
          $('<option>').val(v.uuid).text(v.name).appendTo('#binance_chain_token');
        });
      } else {
        //show error?
      }
    })
  }

  var getFees = () => {
    callAPI('GET', apiURL+'fees', null, (err, data) => {
      if(err) {
        console.log(err)
        return
      }
      console.log(data)
      if(data.status == 200) {
        let issueFee = data.result.filter((fee) => {
          return fee.msg_type === 'issueMsg'
        }).map((fee) => {
          return fee.fee
        })

        const finalFee = issueFee[0]/100000000
        $("#issue_amount").text(finalFee)
      } else {
        //show error?
      }
    })
  }

  getSupportedTokens();
  getFees();

  $("#Issue").submit(function(e) {
    e.preventDefault();
    var form = $(this);
    const submitObj = $('#Issue').serializeObject();
    var act_tab_num = $('div.activeIssue').attr('id').substring(4, 5);

    switch (act_tab_num) {
      case '1':
        callAPI('POST', apiURL+'tokens', submitObj, (err, result) => {
          if(err) {
            console.log(err)
            return
          }

          if(result.success) {
            let data = result.result;
            $('#tab-'+act_tab_num+"-Issue").removeClass('activeIssue');
            $('#tab-'+(parseInt(act_tab_num)+1)+"-Issue").addClass('activeIssue');

            $('#account').text(data.bnb_address)
            $('#uuid').val(data.uuid)

            console.log($('#uuid').val())
          } else {
            console.log(result.errorMsg)
          }
        })
        break;
      case '2':
        callAPI('POST', apiURL+'finalizeToken', submitObj, (err, result) => {
          if(err) {
            console.log(err)
          }

          if(result.success) {
            let data = result.result;
            $('#tab-'+act_tab_num+"-Issue").removeClass('activeIssue');
            $('#tab-'+(parseInt(act_tab_num)+1)+"-Issue").addClass('activeIssue');

            $('#account').text(data.bnb_address)
          } else {
            console.log(result.errorMsg)
          }
        })
        break;
      default:

    }
  })

  $("#Swap").submit(function(e) {
    e.preventDefault();
    var form = $(this);
    const submitObj = $('#Swap').serializeObject();
    var act_tab_num = $('div.activeSwap').attr('id').substring(4, 5);

    switch (act_tab_num) {
      case '1':
        const swapJson = {
          token_uuid: submitObj.binance_chain_token,
          bnb_address: submitObj.bnb_receive,
          eth_address: submitObj.erc_from,
          amount: submitObj.swap_amount
        }

        console.log(swapJson)

        callAPI('POST', apiURL+'swap', swapJson, (err, result) => {
          if(err) {
            console.log(err)
            return
          }

          if(result.success) {
            let data = result.result;
            $('#tab-'+act_tab_num+"-Swap").removeClass('activeSwap');
            $('#tab-'+(parseInt(act_tab_num)+1)+"-Swap").addClass('activeSwap');

            $('#account').text(data.bnb_address)
            $('#swap_uuid').val(data.swap_uuid)

            let theToken = tokens.filter((token) => {
              return token.uuid == submitObj.binance_chain_token
            }).map((token) => {
              return token.symbol
            })

            let tokenSymbol = 'unknown'
            if(theToken.length > 0) {
              tokenSymbol = theToken[0]
            }

            $('#swap_amount_text').text(submitObj.swap_amount)
            $('#swap_token_symbol_text').text(tokenSymbol)
            $('#swap_token_from_text').text(submitObj.erc_from)
            $('#swap_token_to_text').text(data.eth_address)

            console.log($('#swap_uuid').val())
          } else {
            console.log(result.errorMsg)
          }
        })
        break;
      case '2':
        const finalizeJson = {
          uuid: submitObj.swap_uuid
        }

        console.log(finalizeJson)

        callAPI('POST', apiURL+'finalizeSwap', finalizeJson, (err, result) => {
          if(err) {
            console.log(err)
          }

          if(result.success) {
            let data = result.result;
            $('#tab-'+act_tab_num+"-Swap").removeClass('activeSwap');
            $('#tab-'+(parseInt(act_tab_num)+1)+"-Swap").addClass('activeSwap');

            $('#account').text(data.bnb_address)
          } else {
            console.log(result.errorMsg)
          }
        })
        break;
      default:

    }
  })


  // Validation for Swap form
  var validatorSwap = $('#Swap').validate({
    rules: {
      'binance_chain_token': {
        required: true
      },
      'bnb_receive': {
        required: true,
        minlength: 3
      },
      'erc_from': {
        required: true,
        minlength: 3
      },
      'swap_mount': {
        required: true,
        digits: true
      },
      'swap_uuid': {
        required: false
      }
    },
  });
  // Validation for Issue form
  var validatorIssue = $('#Issue').validate({
    rules: {
      'erc20_address': {
        required: true,
        minlength: 3
      },
      'name': {
        required: true
      },
      'symbol': {
        required: true
      },
      'total_supply': {
        required: true,
        digits: true
      },
      'uuid': {
        required: false
      }
    },
  });


  $('.nav-button').click(function() {

    var form_name = $(this).closest("form").attr('id');
    var form_action = $(this).attr('data-nav');
    var act_tab_num = $('div.active'+form_name).attr('id').substring(4, 5);

    if (form_action == "next") {
      var valid = $('#'+form_name).valid(); //xxxxxxx
      if(!valid) {
        // eval('validator'+form_name).focusInvalid(); //xxxxxxxx
        return false;
      } else {
        $('#'+form_name).submit();
        // $('#tab-'+act_tab_num+"-"+form_name).removeClass('active'+form_name);
        // $('#tab-'+(parseInt(act_tab_num)+1)+"-"+form_name).addClass('active'+form_name);
      }
    } else if (form_action == "previous") {

      $('#tab-'+act_tab_num+"-"+form_name).removeClass('active'+form_name);
      $('#tab-'+(parseInt(act_tab_num)-1)+"-"+form_name).addClass('active'+form_name);
    } else if (form_action == "done") {

      $('#tab-'+act_tab_num+"-"+form_name).removeClass('active'+form_name);
      $('#tab-1'+"-"+form_name).addClass('active'+form_name);

      $(".page-form").trigger('reset');
    }
  });

  $('#binance_chain_token, #bnb_receive, #erc_from, #swap_amount, #erc20_address, #name, #symbol, #total_supply').change(function(){
    $("#"+$(this).attr('id') + '-text').html($(this).val());
  });

  // TAB SLIDER START
  $("#tile-1 .nav-tabs a").click(function() {
    var position = $(this).parent().position();
    var width = $(this).parent().width();
      $("#tile-1 .slider").css({"left":+ position.left,"width":width});
  });
  var actWidth = $("#tile-1 .nav-tabs").find(".active").parent("li").width();
  var actPosition = $("#tile-1 .nav-tabs .active").position();
  $("#tile-1 .slider").css({"left":+ actPosition.left,"width": actWidth});
  // TAB SLIDER END

});

(function($){
    $.fn.serializeObject = function(){

        var self = this,
            json = {},
            push_counters = {},
            patterns = {
                "validate": /^[a-zA-Z][a-zA-Z0-9_]*(?:\[(?:\d*|[a-zA-Z0-9_]+)\])*$/,
                "key":      /[a-zA-Z0-9_]+|(?=\[\])/g,
                "push":     /^$/,
                "fixed":    /^\d+$/,
                "named":    /^[a-zA-Z0-9_]+$/
            };


        this.build = function(base, key, value){
            base[key] = value;
            return base;
        };

        this.push_counter = function(key){
            if(push_counters[key] === undefined){
                push_counters[key] = 0;
            }
            return push_counters[key]++;
        };

        $.each($(this).serializeArray(), function(){

            // skip invalid keys
            if(!patterns.validate.test(this.name)){
                return;
            }

            var k,
                keys = this.name.match(patterns.key),
                merge = this.value,
                reverse_key = this.name;

            while((k = keys.pop()) !== undefined){

                // adjust reverse_key
                reverse_key = reverse_key.replace(new RegExp("\\[" + k + "\\]$"), '');

                // push
                if(k.match(patterns.push)){
                    merge = self.build([], self.push_counter(reverse_key), merge);
                }

                // fixed
                else if(k.match(patterns.fixed)){
                    merge = self.build([], k, merge);
                }

                // named
                else if(k.match(patterns.named)){
                    merge = self.build({}, k, merge);
                }
            }

            json = $.extend(true, json, merge);
        });

        return json;
    };
})(jQuery);
