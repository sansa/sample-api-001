let users = [];

export const getUsers = (req, res) => {
  res.json(users);
};

export const getUser = (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};

export const createUser = (req, res) => {
  const newUser = { id: `${Date.now()}`, ...req.body };
  users.push(newUser);
  res.status(201).json(newUser);
};

export const updateUser = (req, res) => {
  const index = users.findIndex(u => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "User not found" });
  users[index] = { ...users[index], ...req.body };
  res.json(users[index]);
};

export const deleteUser = (req, res) => {
  users = users.filter(u => u.id !== req.params.id);
  res.status(204).send();
};
