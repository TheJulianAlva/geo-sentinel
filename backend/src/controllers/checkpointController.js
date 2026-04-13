// Placeholder for checkpoints controller
const checkpointController = {
  async create(req, res) {
    res.status(201).json({ message: 'Checkpoint received' });
  }
};

module.exports = checkpointController;
