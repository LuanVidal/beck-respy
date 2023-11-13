class ScreenManager {
  constructor(io) {
    this.matricula = '';
    this.ordemproducao = '';
    this.id = '';
    this.consumivel = '';
    this.currentScreen = 'matricula';
    this.mec = '8C:AA:B5:6A:78:F0';
    this.io = io;
    this.screens = {
      'home': {
        action: () => {
          this.sendDataToServer('carregamento', 'Carregando...');
        }
      },
      'matricula': {
        action: () => {
          this.sendDataToServer('matricula', this.matricula);
        }
      },
      'ordemproducao': {
        action: () => {
          this.sendDataToServer('ordemProducao', this.ordemproducao);
          console.log("DENTRO DA ORDEM");
        }
      },
      'id': {
        action: () => {
          this.sendDataToServer('idNumber', this.id);
        }
      },
      'consumivel': {
        action: () => {
          this.sendDataToServer('consumivel', this.consumivel);
        }
      },
      'validando': {
        action: async () => {
          console.log("VALIDANDO");
          const requestBody = {
            matricula: this.matricula,
            mac: this.mec,
            ordemProducao: this.ordemproducao,
            atividade: this.id, // Substitua com o valor correto
            material: this.consumivel    // Substitua com o valor correto
          };

          try {
            const response = await this.fazerRequisicaoHTTPComValidacao('/delp/arduino/inicioProcesso', requestBody);
            console.log(requestBody);

            if (response) {
              console.log('Requisição bem-sucedida:', response);
              this.io.emit('changepath', 'rastreabilidade');

            } else {
              console.error('Erro na requisição:', this.lastError);
              this.showPopup('ERRO', this.lastError.error, 'error');

              this.resetVariables();

              this.currentScreen = "matricula";
              this.io.emit('changepath', 'matricula'); // Altere para a tela desejada em caso de falha
            }
          } catch (error) {
            console.error('Erro na requisição:', this.lastError);
            this.showPopup('Erro', 'Erro na requisição. Tente novamente.', 'error');

            resetVariables();
              
            this.currentScreen = "matricula";
            this.io.emit('changepath', 'matricula'); // Altere para a tela desejada em caso de falha
          }
        }
      },
      'rastreabilidade': {
        action: () => {
          this.sendDataToServer('telaRastreabilidade1', 'Dados da rastreabilidade 1');
        }
      },
      'finaliza': {
        action: () => {
          this.sendDataToServer('finalizaProcesso', 'Finalizando o processo');
        }
      }
    };
  }

  setIO(io) {
    this.io = io;
  }

  resetVariables() {
    this.matricula = '';
    this.ordemproducao = '';
    this.id = '';
    this.consumivel = '';
  }

  showPopup(title, text, type = 'error', time = 2000) {
    this.io.emit('swal', {
      title: title,
      text: text,
      type: type,
      time: time
    });
  }


  async fazerRequisicaoHTTP(host, port, endpoint, requestBody) {
    const url = `https://${host}:${port}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      return {
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error('Erro na requisição:', error.message);
      throw error;
    }
  }

  async fazerRequisicaoHTTPComValidacao(endpoint, requestBody) {
    try {
      const response = await this.fazerRequisicaoHTTP("delp.tcsapp.com.br", 443, endpoint, requestBody);

      if (response.status === 200) {
        console.log('Requisição bem-sucedida:', response.data);
        return true;
      } else {
        console.error('Erro na requisição:', response.data);
        this.lastError = response.data;
        return false;
      }
    } catch (error) {
      console.error('Erro na requisição:', error.message);
      this.lastError = error.message;
      return false;
    }
  }

  logVariableValues() {
    console.log('Matrícula:', this.matricula);
    console.log('Ordem de Produção:', this.ordemproducao);
    console.log('ID Number:', this.id);
    console.log('Consumível:', this.consumivel);
    console.log('Tela Atual:', this.currentScreen);
  }

  handleKey(key) {
    switch (key) {
      case 'D':
        this.handleDelete();
        break;
      case '*':
        this.handleBack();
        break;
      case '#':
        this.handleNext();
        break;
      default:
        this.handleCharacter(key);
        break;
    }
  }

  handleDelete() {
    if (this[this.currentScreen] !== '') {
      this[this.currentScreen] = this[this.currentScreen].slice(0, -1);
      this.screens[this.currentScreen].action();
    }
    this.logVariableValues();
  }

  handleBack() {
    const previousScreen = this.getPreviousScreen();
    if (previousScreen !== null) {
      this.changeScreenTo(previousScreen);
    }
  }

  handleNext() {
    this.changeScreenTo(this.getNextScreen());
  }

  handleCharacter(key) {
    console.log('Current Screen:', this.currentScreen);
    const maxDigits = {
      matricula: 5,
      ordemproducao: 7,
      id: 2,
      consumivel: 2,
    };
  
    if (this.currentScreen && this[this.currentScreen].length < maxDigits[this.currentScreen]) {
      this[this.currentScreen] += key;
      this.screens[this.currentScreen].action();
    }
    this.logVariableValues(); // Mostra os valores após a modificação
  }
  

  sendDataToServer(param, msg) {
    this.io.emit(param, msg);
  }

  changeScreenTo(screenName) {
    if (this.screens[screenName]) {
      this.currentScreen = screenName;
      this.screens[this.currentScreen].action();
    }
  }

  getPreviousScreen() {
    const screenOrder = Object.keys(this.screens);
    const currentIndex = screenOrder.indexOf(this.currentScreen);
  
    if (currentIndex > 0) {
      const previousScreen = screenOrder[currentIndex - 1];
      this.currentScreen = previousScreen;
      this.io.emit('keyboard', previousScreen);
      console.log(this.currentScreen);
      return previousScreen;
    } else {
      // Se já estiver na primeira tela, não há tela anterior
      return null;
    }
  }
  
  getNextScreen() {
    const screenOrder = Object.keys(this.screens);
    const currentIndex = screenOrder.indexOf(this.currentScreen);
  
    if (currentIndex < screenOrder.length - 1) {
      const nextScreen = screenOrder[currentIndex + 1];
      this.currentScreen = nextScreen;
      this.io.emit('changepath', nextScreen);
      console.log(this.currentScreen);
      return nextScreen;
    } else {
      // Se já estiver na última tela, não há tela seguinte
      return null;
    }
  }
}

module.exports = ScreenManager;
